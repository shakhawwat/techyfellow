import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { ClientSession, Model, Types } from "mongoose";
import { emailConfiguration, emailOperationalStatus } from "./email.config";
import { notificationKinds, notificationStatuses, type NotificationRecord } from "./notification.schema";
import { leadId } from "../leads/lead-input";
export function notificationDto(job: NotificationRecord & { _id: unknown }) { return { id: String(job._id), leadId: String(job.leadId), reference: job.reference, kind: job.kind, status: job.status, attempts: job.attempts, nextAttemptAt: job.nextAttemptAt, leaseExpiresAt: job.leaseExpiresAt, firstAttemptAt: job.firstAttemptAt, sentAt: job.sentAt, lastFailure: job.lastFailure, createdAt: job.createdAt, updatedAt: job.updatedAt }; }
@Injectable()
export class NotificationService {
  constructor(@InjectModel("NotificationJob") private readonly jobs: Model<NotificationRecord>) {}
  async enqueue(lead: { _id: Types.ObjectId; reference: string }, session: ClientSession) {
    await this.jobs.create(notificationKinds.map(kind => ({ leadId: lead._id, reference: lead.reference, kind, templateVersion: 1, key: `techyfellow/${lead._id}/${kind}/v1`, status: "pending", attempts: 0, nextAttemptAt: new Date() })), { session, ordered: true });
  }
  async status() {
    const counts = Object.fromEntries(await Promise.all(notificationStatuses.map(async status => [status, await this.jobs.countDocuments({ status }).maxTimeMS(1500)])));
    const abandonedLeases = await this.jobs.countDocuments({ status: "processing", $expr: { $lte: ["$leaseExpiresAt", "$$NOW"] } }).maxTimeMS(1500);
    return { data: { ...emailOperationalStatus(emailConfiguration(process.env)), counts, abandonedLeases, limits: { maxAttempts: 5, leaseSeconds: 60, retryWindowHours: 23 }, note: "Configuration and queue state do not prove worker liveness or delivery to an inbox." } };
  }
  async list(raw: Record<string, unknown>) {
    const allowed = ["page", "limit", "status", "kind", "leadId"];
    if (Object.keys(raw).some(key => !allowed.includes(key))) throw new BadRequestException();
    const integer = (key: string, fallback: number, max: number) => { if (raw[key] === undefined) return fallback; const value = raw[key]; if (typeof value !== "string" || !/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) > max) throw new BadRequestException(); return Number(value); };
    const page = integer("page", 1, 1000000), limit = integer("limit", 20, 100), filter: Record<string, unknown> = {};
    if (raw.status !== undefined) { if (!notificationStatuses.includes(raw.status as NotificationRecord["status"])) throw new BadRequestException(); filter.status = raw.status; }
    if (raw.kind !== undefined) { if (!notificationKinds.includes(raw.kind as NotificationRecord["kind"])) throw new BadRequestException(); filter.kind = raw.kind; }
    if (raw.leadId !== undefined) filter.leadId = leadId(raw.leadId);
    const [jobs, total] = await Promise.all([this.jobs.find(filter).sort({ createdAt: -1, _id: 1 }).skip((page - 1) * limit).limit(limit).maxTimeMS(1500).lean(), this.jobs.countDocuments(filter).maxTimeMS(1500)]);
    return { data: jobs.map(notificationDto), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
