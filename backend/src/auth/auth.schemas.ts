import { Schema, type Types } from "mongoose";
import { roles, type Role } from "./permissions";

export function normalizeEmail(value: string): string { return value.trim().toLowerCase(); }
export function validEmail(value: string): boolean {
  return value.length <= 254 && /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(value);
}
export interface UserRecord {
  name?: string; emailVerifiedAt?: Date; email: string; passwordHash: string; role: Role; enabled: boolean;
  createdAt: Date; updatedAt: Date;
}
export interface SessionRecord {
  userId: Types.ObjectId; tokenHash: string; expiresAt: Date; revokedAt?: Date;
  createdAt: Date; updatedAt: Date;
}
export interface ThrottleRecord { key: string; attempts: number; expiresAt: Date }
export interface AuditRecord {
  event: "login" | "logout" | "register" | "verify_email"; outcome: "success" | "invalid_credentials" | "throttled" | "invalid_request" | "csrf_rejected";
  userId?: Types.ObjectId; createdAt: Date;
}
const options = { autoCreate: false, autoIndex: false, strict: true };
const userSchema = new Schema<UserRecord>({
  name: { type: String, trim: true, maxlength: 120 },
  emailVerifiedAt: Date,
  email: { type: String, required: true, set: normalizeEmail, validate: validEmail },
  passwordHash: { type: String, required: true, select: false, maxlength: 512, match: /^\$argon2id\$/ },
  role: { type: String, required: true, enum: roles },
  enabled: { type: Boolean, required: true, default: true },
}, { ...options, timestamps: true });
userSchema.index({ email: 1 }, { unique: true, name: "email_unique" });
const sessionSchema = new Schema<SessionRecord>({
  userId: { type: Schema.Types.ObjectId, required: true },
  tokenHash: { type: String, required: true, select: false, match: /^[a-f0-9]{64}$/ },
  expiresAt: { type: Date, required: true },
  revokedAt: Date,
}, { ...options, timestamps: true });
sessionSchema.index({ tokenHash: 1 }, { unique: true, name: "session_token_unique" });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "session_expiry" });
sessionSchema.index({ userId: 1, revokedAt: 1 }, { name: "session_user" });
const throttleSchema = new Schema<ThrottleRecord>({
  key: { type: String, required: true }, attempts: { type: Number, required: true }, expiresAt: { type: Date, required: true },
}, options);
throttleSchema.index({ key: 1 }, { unique: true, name: "throttle_key_unique" });
throttleSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "throttle_expiry" });
const auditSchema = new Schema<AuditRecord>({
  event: { type: String, enum: ["login", "logout", "register", "verify_email"], required: true },
  outcome: { type: String, enum: ["success", "invalid_credentials", "throttled", "invalid_request", "csrf_rejected"], required: true },
  userId: Schema.Types.ObjectId,
  createdAt: { type: Date, required: true, default: Date.now, immutable: true },
}, options);
auditSchema.index({ createdAt: -1 }, { name: "audit_created" });
export const authDefinitions = {
  user: { name: "User", collection: "users", schema: userSchema },
  session: { name: "AuthSession", collection: "auth_sessions", schema: sessionSchema },
  throttle: { name: "LoginThrottle", collection: "login_throttles", schema: throttleSchema },
  audit: { name: "AuthAudit", collection: "auth_audits", schema: auditSchema },
};
