import { randomBytes } from "node:crypto";
import type { Model } from "mongoose";
import type { LeadRecord } from "../leads/lead.schema";
import type { EmailConfiguration } from "./email.config";
import { EmailProviderError, type EmailProvider } from "./email-provider";
import type { NotificationRecord } from "./notification.schema";
import { notificationTemplate } from "./templates";
export const MAX_ATTEMPTS = 5, LEASE_SECONDS = 60, RETRY_WINDOW_HOURS = 23;
export const retryDelaySeconds = (attempt: number) => Math.min(900, 60 * 2 ** (attempt - 1));
const expired = { $expr: { $lte: ["$leaseExpiresAt", "$$NOW"] } };
const cutoff = { $dateSubtract: { startDate: "$$NOW", unit: "hour", amount: RETRY_WINDOW_HOURS } };
export class NotificationProcessor {
  constructor(private readonly jobs: Model<NotificationRecord>, private readonly leads: Model<LeadRecord>, private readonly config: EmailConfiguration, private readonly provider: EmailProvider) {}
  async claim() {
    if (this.config.mode !== "enabled") return null;
    // Reap only abandoned work; never alter another worker's live lease.
    await this.jobs.updateMany({ status: "processing", ...expired, attempts: { $gte: MAX_ATTEMPTS } }, { $set: { status: "failed", lastFailure: "attempts_exhausted" }, $unset: { leaseToken: 1, leaseExpiresAt: 1 } }).maxTimeMS(1500);
    await this.jobs.updateMany({ status: { $in: ["pending", "processing"] }, firstAttemptAt: { $exists: true }, $and: [{ $or: [{ status: "pending" }, { status: "processing", ...expired }] }, { $expr: { $lte: ["$firstAttemptAt", cutoff] } }] }, { $set: { status: "failed", lastFailure: "delivery_window_expired" }, $unset: { leaseToken: 1, leaseExpiresAt: 1 } }).maxTimeMS(1500);
    const leaseToken = randomBytes(24).toString("hex");
    return this.jobs.findOneAndUpdate({ attempts: { $lt: MAX_ATTEMPTS }, $and: [
      { $or: [{ status: "pending", $expr: { $lte: ["$nextAttemptAt", "$$NOW"] } }, { status: "processing", ...expired }] },
      { $or: [{ firstAttemptAt: { $exists: false } }, { $expr: { $gt: ["$firstAttemptAt", cutoff] } }] },
    ] }, [{ $set: { status: "processing", leaseToken, leaseExpiresAt: { $dateAdd: { startDate: "$$NOW", unit: "second", amount: LEASE_SECONDS } }, attempts: { $add: ["$attempts", 1] }, firstAttemptAt: { $ifNull: ["$firstAttemptAt", "$$NOW"] }, updatedAt: "$$NOW" } }], { new: true, updatePipeline: true, sort: { nextAttemptAt: 1, _id: 1 } }).select("+message +leaseToken").maxTimeMS(1500).lean();
  }
  async processOne(): Promise<"paused" | "idle" | "sent" | "retry" | "failed" | "lease_lost"> {
    if (this.config.mode !== "enabled") return "paused";
    const job = await this.claim(); if (!job) return "idle";
    return this.processClaimed(job);
  }
  async processClaimed(job: NotificationRecord & { _id: unknown }): Promise<"sent" | "retry" | "failed" | "lease_lost"> {
    const fence = { _id: job._id, status: "processing" as const, leaseToken: job.leaseToken, $expr: { $gt: ["$leaseExpiresAt", "$$NOW"] } };
    let message = job.message;
    if (!message) {
      const lead = await this.leads.findById(job.leadId).select("name email reference type").maxTimeMS(1500).lean();
      if (!lead) { await this.jobs.updateOne(fence, { $set: { status: "failed", lastFailure: "lead_missing" }, $unset: { leaseToken: 1, leaseExpiresAt: 1 } }).maxTimeMS(1500); return "failed"; }
      message = notificationTemplate(job.kind, lead, this.config);
      const saved = await this.jobs.updateOne(fence, { $set: { message } }, { runValidators: true }).maxTimeMS(1500); if (!saved.matchedCount) return "lease_lost";
    }
    // Ensure a stalled worker still owns enough lease for the bounded 10-second provider call.
    const active = await this.jobs.exists({ ...fence, $expr: { $gt: ["$leaseExpiresAt", { $dateAdd: { startDate: "$$NOW", unit: "second", amount: 12 } }] } }).maxTimeMS(1500); if (!active) return "lease_lost";
    let failure: EmailProviderError | undefined;
    try { await this.provider.send({ from: message.from, to: [...message.to], subject: message.subject, text: message.text, html: message.html }, job.key); }
    catch (error) { failure = error instanceof EmailProviderError ? error : new EmailProviderError("provider_unconfirmed", true); }
    if (!failure) { const saved = await this.jobs.updateOne(fence, [{ $set: { status: "sent", sentAt: "$$NOW", updatedAt: "$$NOW" } }, { $unset: ["leaseToken", "leaseExpiresAt", "lastFailure"] }], { updatePipeline: true }).maxTimeMS(1500); return saved.matchedCount ? "sent" : "lease_lost"; }
    const terminal = !failure.retryable || job.attempts >= MAX_ATTEMPTS;
    const saved = await this.jobs.updateOne(fence, [{ $set: { status: terminal ? "failed" : "pending", lastFailure: failure.code, nextAttemptAt: { $dateAdd: { startDate: "$$NOW", unit: "second", amount: retryDelaySeconds(job.attempts) } }, updatedAt: "$$NOW" } }, { $unset: ["leaseToken", "leaseExpiresAt"] }], { updatePipeline: true }).maxTimeMS(1500);
    return !saved.matchedCount ? "lease_lost" : terminal ? "failed" : "retry";
  }
}
