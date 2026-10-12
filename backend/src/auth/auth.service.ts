import { BadRequestException, HttpException, Injectable, ServiceUnavailableException, UnauthorizedException, type OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { randomBytes } from "node:crypto";
import { Model, Types } from "mongoose";
import { normalizeEmail, validEmail, type UserRecord, type SessionRecord, type ThrottleRecord, type AuditRecord } from "./auth.schemas";
import { hashPassword, verifyPassword } from "./password";
import { hashToken, type AuthIdentity } from "./auth-http";
import { roles } from "./permissions";

@Injectable()
export class AuthService implements OnModuleInit {
  private dummyHash!: string;
  constructor(
    @InjectModel("User") private readonly users: Model<UserRecord>,
    @InjectModel("AuthSession") private readonly sessions: Model<SessionRecord>,
    @InjectModel("LoginThrottle") private readonly throttles: Model<ThrottleRecord>,
    @InjectModel("AuthAudit") private readonly audits: Model<AuditRecord>,
    private readonly config: ConfigService,
  ) {}
  async onModuleInit(): Promise<void> { this.dummyHash = await hashPassword(randomBytes(32).toString("hex")); }
  async audit(event: AuditRecord["event"], outcome: AuditRecord["outcome"], userId?: string): Promise<void> {
    try { await this.audits.create({ event, outcome, ...(userId ? { userId: new Types.ObjectId(userId) } : {}) }); }
    catch { throw new ServiceUnavailableException(); }
  }
  async throttle(ip: string, email: string, event: AuditRecord["event"] = "login"): Promise<void> {
    const now = Date.now();
    const window = Math.floor(now / 900_000);
    const expiresAt = new Date((window + 1) * 900_000);
    try {
      const counters = await Promise.all([`ip:${ip}`, `email:${email}`].map(async identity => {
        const key = hashToken(`${identity}:${window}`);
        const update = { $inc: { attempts: 1 }, $setOnInsert: { expiresAt } };
        try {
          return await this.throttles.findOneAndUpdate({ key }, update, { upsert: true, new: true }).maxTimeMS(1500).lean();
        } catch (error) {
          // Concurrent first attempts can race on the unique index: retry without upsert.
          if (!(error instanceof Error) || !("code" in error) || error.code !== 11000) throw error;
          return await this.throttles.findOneAndUpdate({ key }, { $inc: { attempts: 1 } }, { new: true }).maxTimeMS(1500).lean();
        }
      }));
      if (!counters[0] || !counters[1]) throw new ServiceUnavailableException();
      if (counters[0].attempts > 30 || counters[1].attempts > 5) {
        await this.audit(event, "throttled");
        throw new HttpException("Login throttled", 429);
      }
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new ServiceUnavailableException();
    }
  }
  async login(body: unknown, ip: string, previousToken?: string, publicAccount = false) {
    const input = body && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : {};
    const email = typeof input.email === "string" ? normalizeEmail(input.email.slice(0, 1024)) : "";
    // Every CSRF-valid attempt, including malformed bodies, consumes the IP budget.
    await this.throttle(ip, email);
    if (Object.keys(input).length !== 2 || !validEmail(email) || typeof input.password !== "string" ||
      input.password.length < 1 || input.password.length > 128 || Buffer.byteLength(input.password) > 1024) {
      await this.audit("login", "invalid_request");
      throw new BadRequestException();
    }
    let user;
    let verified: boolean;
    try {
      user = await this.users.findOne({ email: { $eq: email } }).select("+passwordHash").maxTimeMS(1500).lean();
      verified = await verifyPassword(user?.passwordHash ?? this.dummyHash, input.password);
    } catch { throw new ServiceUnavailableException(); }
    if (!user || !verified || !user.enabled || !roles.includes(user.role) || (publicAccount ? user.role !== "MEMBER" : user.role === "MEMBER")) {
      await this.audit("login", "invalid_credentials");
      throw new UnauthorizedException();
    }
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + this.config.getOrThrow<number>("AUTH_SESSION_TTL_SECONDS") * 1000);
    let sessionId: Types.ObjectId | undefined;
    try {
      // Never reuse a client-supplied token. Revoke the previous browser session on successful login.
      if (previousToken) await this.sessions.updateOne({ tokenHash: hashToken(previousToken), revokedAt: null }, { $set: { revokedAt: new Date() } }).maxTimeMS(1500);
      const session = await this.sessions.create({ userId: user._id, tokenHash: hashToken(token), expiresAt });
      sessionId = session._id;
      await this.audit("login", "success", String(user._id));
    } catch {
      if (sessionId) await this.sessions.updateOne({ _id: sessionId }, { $set: { revokedAt: new Date() } }).catch(() => undefined);
      throw new ServiceUnavailableException();
    }
    return { token, expiresAt, user: { id: String(user._id), email: user.email, role: user.role } satisfies AuthIdentity };
  }
  async authenticate(token: string | undefined) {
    if (!token) throw new UnauthorizedException();
    try {
      const session = await this.sessions.findOne({ tokenHash: hashToken(token), revokedAt: null, expiresAt: { $gt: new Date() } }).maxTimeMS(1500).lean();
      if (!session) throw new UnauthorizedException();
      // Reload enabled/role on EVERY request; no stale permission or account-status cache.
      const user = await this.users.findOne({ _id: session.userId, enabled: true }).maxTimeMS(1500).lean();
      if (!user || !roles.includes(user.role)) throw new UnauthorizedException();
      return { sessionId: String(session._id), user: { id: String(user._id), email: user.email, role: user.role } satisfies AuthIdentity };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new ServiceUnavailableException();
    }
  }
  async logout(sessionId: string, userId: string): Promise<void> {
    try { await this.sessions.updateOne({ _id: sessionId }, { $set: { revokedAt: new Date() } }).maxTimeMS(1500); }
    catch { throw new ServiceUnavailableException(); }
    await this.audit("logout", "success", userId);
  }
}
