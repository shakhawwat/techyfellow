import { Schema, type Types } from "mongoose";
export const notificationKinds = ["acknowledgment", "internal"] as const;
export const notificationStatuses = ["pending", "processing", "sent", "failed"] as const;
export type NotificationKind = typeof notificationKinds[number];
export interface EmailMessage { from: string; to: string[]; subject: string; text: string; html: string }
export interface NotificationRecord {
  key: string; leadId: Types.ObjectId; reference: string; kind: NotificationKind; templateVersion: 1;
  status: typeof notificationStatuses[number]; attempts: number; nextAttemptAt: Date;
  leaseToken?: string; leaseExpiresAt?: Date; firstAttemptAt?: Date; sentAt?: Date;
  lastFailure?: string; message?: EmailMessage; createdAt: Date; updatedAt: Date;
}
const message = new Schema<EmailMessage>({ from: String, to: [String], subject: String, text: String, html: String }, { _id: false, strict: "throw" });
const schema = new Schema<NotificationRecord>({
  key: { type: String, required: true, immutable: true }, leadId: { type: Schema.Types.ObjectId, required: true, immutable: true },
  reference: { type: String, required: true, immutable: true, match: /^TF-[A-F0-9]{24}$/ }, kind: { type: String, required: true, immutable: true, enum: notificationKinds }, templateVersion: { type: Number, required: true, immutable: true, enum: [1] },
  status: { type: String, required: true, enum: notificationStatuses, default: "pending" }, attempts: { type: Number, required: true, min: 0, max: 5, default: 0 }, nextAttemptAt: { type: Date, required: true },
  leaseToken: { type: String, select: false }, leaseExpiresAt: Date, firstAttemptAt: Date, sentAt: Date,
  lastFailure: { type: String, enum: ["provider_transient", "provider_rejected", "provider_unconfirmed", "lead_missing", "attempts_exhausted", "delivery_window_expired"] }, message: { type: message, select: false },
}, { timestamps: true, autoCreate: false, autoIndex: false, strict: "throw" });
schema.index({ key: 1 }, { unique: true, name: "notification_key_unique" });
schema.index({ status: 1, nextAttemptAt: 1, _id: 1 }, { name: "notification_due" });
schema.index({ status: 1, leaseExpiresAt: 1 }, { name: "notification_expired_lease" });
schema.index({ leadId: 1, kind: 1 }, { unique: true, name: "notification_lead_kind_unique" });
schema.index({ status: 1, createdAt: -1, _id: 1 }, { name: "notification_admin_status" });
export const notificationDefinition = { name: "NotificationJob", collection: "notification_jobs", schema };
