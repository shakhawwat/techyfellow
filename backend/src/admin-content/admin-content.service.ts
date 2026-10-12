import { MediaService } from "../media/media.service";
import { BadRequestException, ConflictException, ForbiddenException, HttpException, Injectable, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Connection, Error as MongooseError, Model, Types, type ClientSession } from "mongoose";
import { hasPermission } from "../auth/permissions";
import type { AuthIdentity } from "../auth/auth-http";
import type { ContentKind, ContentRecord } from "../content/content.types";
import { parseAdminQuery } from "./admin-query";
import { parseAction, parseContentInput, toAdminDto } from "./content-input";
import type { ContentAction, ContentAuditRecord } from "./content-audit.schema";

@Injectable()
export class AdminContentService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly media: MediaService,
    @InjectModel("Project") private readonly projects: Model<ContentRecord>,
    @InjectModel("ResearchProject") private readonly research: Model<ContentRecord>,
    @InjectModel("Publication") private readonly publications: Model<ContentRecord>,
    @InjectModel("TeamMember") private readonly team: Model<ContentRecord>,
    @InjectModel("Course") private readonly courses: Model<ContentRecord>,
    @InjectModel("ContentAudit") private readonly audits: Model<ContentAuditRecord>,
  ) {}
  private async transaction<T>(work: (session: ClientSession) => Promise<T>): Promise<T> {
    const session = await this.connection.startSession();
    try {
      return await session.withTransaction(work, { readPreference: "primary", readConcern: { level: "snapshot" },
        writeConcern: { w: "majority" }, maxCommitTimeMS: 1500, timeoutMS: 5000 });
    } finally { await session.endSession(); }
  }
  private model(kind: ContentKind) { return this[kind]; }
  private id(value: string): Types.ObjectId {
    if (!/^[a-fA-F0-9]{24}$/.test(value)) throw new BadRequestException({ fields: ["id"] });
    return new Types.ObjectId(value);
  }
  private authorize(kind: ContentKind, actor: AuthIdentity, action: "read" | "edit" | "publish"): void {
    if (!hasPermission(actor.role, `${kind}:${action}`)) throw new ForbiddenException();
  }
  private failure(error: unknown): never {
    if (error instanceof HttpException) throw error;
    if (error instanceof MongooseError.ValidationError) {
      // Only schema-defined validation paths, never invalid values/driver messages.
      throw new BadRequestException({ fields: Object.keys(error.errors).filter(path => /^[a-zA-Z]+(?:\.(?:\d+|[a-zA-Z]+))*$/.test(path)).sort() });
    }
    if (error instanceof Error && "code" in error && error.code === 11000) throw new ConflictException();
    throw new ServiceUnavailableException();
  }
  async list(kind: ContentKind, raw: Record<string, unknown>, actor: AuthIdentity) {
    this.authorize(kind, actor, "read");
    const { page, limit, skip, sort, filter } = parseAdminQuery(kind, raw);
    try {
      const [records, total] = await Promise.all([
        this.model(kind).find(filter).sort(sort).skip(skip).limit(limit).maxTimeMS(1500).lean<Record<string, unknown>[]>().exec(),
        this.model(kind).countDocuments(filter).maxTimeMS(1500).exec(),
      ]);
      return { data: records.map(record => toAdminDto(kind, record)), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    } catch (error) { return this.failure(error); }
  }
  async detail(kind: ContentKind, value: string, actor: AuthIdentity) {
    this.authorize(kind, actor, "read");
    const id = this.id(value);
    try {
      const record = await this.model(kind).findById(id).maxTimeMS(1500).lean<Record<string, unknown>>().exec();
      if (!record) throw new NotFoundException();
      return { data: toAdminDto(kind, record) };
    } catch (error) { return this.failure(error); }
  }
  async create(kind: ContentKind, body: unknown, actor: AuthIdentity) {
    this.authorize(kind, actor, "edit");
    const { changes } = parseContentInput(kind, body, false);
    try {
      return await this.transaction(async session => {
        const document = new (this.model(kind))({ ...changes, status: "draft", revision: 1 });
        if (kind === "projects") await this.media.validateReferences(document.media, session);
        await document.save({ session });
        await this.audits.create([{ actor: new Types.ObjectId(actor.id), action: "create", resource: kind, contentId: document._id, revision: 1 }], { session });
        return { data: toAdminDto(kind, document.toObject()) };
      });
    } catch (error) { return this.failure(error); }
  }
  async mutate(kind: ContentKind, value: string, action: Exclude<ContentAction, "create">, body: unknown, actor: AuthIdentity, beforeWrite?: (course:ContentRecord,session:ClientSession)=>Promise<void>) {
    this.authorize(kind, actor, action === "publish" || action === "unpublish" ? "publish" : "edit");
    const id = this.id(value);
    const input = action === "edit" ? parseContentInput(kind, body, true) : parseAction(body, action === "publish");
    const expected = input.revision!;
    try {
      return await this.transaction(async session => {
        const document = await this.model(kind).findById(id).session(session).maxTimeMS(1500).exec();
        if (!document) throw new NotFoundException();
        const revision = document.revision ?? 1;
        if (document.status === "published" && (action === "edit" || action === "archive")) this.authorize(kind, actor, "publish");
        if (revision !== expected) throw new ConflictException();
        if (document.status === "archived" || (action === "publish" && document.status !== "draft") || (action === "unpublish" && document.status !== "published")) throw new ConflictException();
        const set: Record<string, unknown> = { revision: expected + 1 };
        const unset: Record<string, 1> = {};
        if (action === "edit" && "changes" in input) {
          if(kind==='courses'&&input.changes.slug!==undefined&&input.changes.slug!==document.slug){
            const linked=await Promise.all(['academy_learning_courses','academy_enrollments','academy_orders'].map(collection=>this.connection.db!.collection(collection).findOne({$or:[{slug:document.slug},{courseSlug:document.slug},{'items.courseSlug':document.slug}]},{session,projection:{_id:1}})));
            if(linked.some(Boolean))throw new ConflictException();
          }
          for (const [key, val] of Object.entries(input.changes)) {
            if (val === null) { document.set(key, undefined); unset[key] = 1; }
            else { document.set(key, val); set[key] = val; }
          }
        } else if (action === "publish") {
          document.status = "published";
          document.publishedAt = "publishedAt" in input && input.publishedAt ? input.publishedAt : new Date();
          set.status = document.status; set.publishedAt = document.publishedAt;
        } else if (action === "unpublish") {
          document.status = "draft"; document.publishedAt = undefined;
          set.status = "draft"; unset.publishedAt = 1;
        } else if (action === "archive") {
          document.status = "archived"; set.status = "archived";
        }
        document.revision = expected + 1;
        // Validate the complete candidate, including publication-only requirements, before writing.
        await document.validate();
        if(beforeWrite)await beforeWrite(document,session);
        if (kind === "projects" && (action === "edit" || action === "publish")) await this.media.validateReferences(document.media, session);
        const precondition = expected === 1 ? { $or: [{ revision: expected }, { revision: { $exists: false } }] } : { revision: expected };
        const updated = await this.model(kind).findOneAndUpdate({ _id: id, ...precondition },
          { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}) }, { session, new: true })
          .maxTimeMS(1500).lean<Record<string, unknown>>().exec();
        if (!updated) throw new ConflictException();
        await this.audits.create([{ actor: new Types.ObjectId(actor.id), action, resource: kind, contentId: id, revision: expected + 1 }], { session });
        return { data: toAdminDto(kind, updated) };
      });
    } catch (error) { return this.failure(error); }
  }
}
