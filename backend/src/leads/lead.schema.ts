import { Schema, type Types } from "mongoose";
export const inquiryTypes = ["engineering", "research", "mentorship", "institutional", "training", "course-interest", "contact"] as const;
export type InquiryType = typeof inquiryTypes[number];
export const leadStatuses = ["received", "triaged", "contacted", "qualified", "proposal", "won", "lost", "closed"] as const;
export type LeadStatus = typeof leadStatuses[number];
export const transitions: Record<LeadStatus, readonly LeadStatus[]> = {
  received: ["triaged", "closed"], triaged: ["contacted", "closed"], contacted: ["qualified", "closed"],
  qualified: ["proposal", "lost", "closed"], proposal: ["won", "lost", "closed"], won: [], lost: [], closed: [],
};
export interface LeadRecord {
  reference: string; type: InquiryType; name: string; email: string; phone?: string; organization?: string;
  payload: Record<string, string | number>; consent: boolean; marketingConsent: boolean; source: string;
  status: LeadStatus; ownerId?: Types.ObjectId; revision: number;
  notes: { text: string; actor: Types.ObjectId; createdAt: Date }[];
  idempotencyHash: string; payloadHash: string; createdAt: Date; updatedAt: Date;
}
export interface LeadAuditRecord { actor: Types.ObjectId; action: string; resource: string; leadId: Types.ObjectId; revision: number; fields: string[]; createdAt: Date }
export interface LeadThrottleRecord { key: string; attempts: number; expiresAt: Date }
const options = { autoCreate: false, autoIndex: false, strict: "throw" as const };
const note = new Schema({ text: { type: String, required: true, maxlength: 4000 }, actor: { type: Schema.Types.ObjectId, required: true }, createdAt: { type: Date, required: true } }, { _id: false, strict: "throw" });
const schema = new Schema<LeadRecord>({
  reference: { type: String, required: true, immutable: true, match: /^TF-[A-F0-9]{24}$/ },
  type: { type: String, enum: inquiryTypes, required: true, immutable: true },
  name: { type: String, required: true, maxlength: 120, immutable: true }, email: { type: String, required: true, maxlength: 254, immutable: true },
  phone: { type: String, maxlength: 40, immutable: true }, organization: { type: String, maxlength: 200, immutable: true },
  payload: { type: Map, of: Schema.Types.Mixed, required: true, immutable: true },
  consent: { type: Boolean, required: true, immutable: true }, marketingConsent: { type: Boolean, required: true, immutable: true },
  source: { type: String, required: true, immutable: true }, status: { type: String, enum: leadStatuses, required: true, default: "received" },
  ownerId: Schema.Types.ObjectId, revision: { type: Number, required: true, default: 1, min: 1, validate: Number.isSafeInteger },
  notes: { type: [note], default: [] },
  idempotencyHash: { type: String, required: true, select: false, immutable: true, match: /^[a-f0-9]{64}$/ },
  payloadHash: { type: String, required: true, select: false, immutable: true, match: /^[a-f0-9]{64}$/ },
}, { ...options, timestamps: true });
schema.index({ reference: 1 }, { unique: true, name: "lead_reference_unique" });
schema.index({ idempotencyHash: 1 }, { unique: true, name: "lead_idempotency_unique" });
schema.index({ createdAt: -1, _id: 1 }, { name: "lead_created" });
schema.index({ updatedAt: -1, _id: 1 }, { name: "lead_updated" });
schema.index({ status: 1, type: 1, createdAt: -1 }, { name: "lead_status_type_created" });
schema.index({ ownerId: 1, createdAt: -1 }, { name: "lead_owner_created" });
const audit = new Schema<LeadAuditRecord>({
  actor: { type: Schema.Types.ObjectId, required: true }, action: { type: String, enum: ["update"], required: true }, resource: { type: String, enum: ["leads"], required: true },
  leadId: { type: Schema.Types.ObjectId, required: true }, revision: { type: Number, required: true, min: 2 },
  fields: [{ type: String, enum: ["status", "ownerId", "note"] }], createdAt: { type: Date, required: true, default: Date.now, immutable: true },
}, options);
audit.index({ leadId: 1, revision: 1 }, { unique: true, name: "lead_audit_revision_unique" });
audit.index({ actor: 1, createdAt: -1 }, { name: "lead_audit_actor_time" });
const throttle = new Schema<LeadThrottleRecord>({ key: { type: String, required: true }, attempts: { type: Number, required: true }, expiresAt: { type: Date, required: true } }, options);
throttle.index({ key: 1 }, { unique: true, name: "lead_throttle_key_unique" });
throttle.index({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "lead_throttle_expiry" });
export const leadDefinitions = {
  lead: { name: "Lead", collection: "leads", schema },
  audit: { name: "LeadAudit", collection: "lead_audits", schema: audit },
  throttle: { name: "LeadThrottle", collection: "lead_throttles", schema: throttle },
};
