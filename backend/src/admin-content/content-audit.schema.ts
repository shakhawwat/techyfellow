import { Schema, type Types } from "mongoose";
import { resources } from "../auth/permissions";
import type { ContentKind } from "../content/content.types";
export const contentActions = ["create", "edit", "publish", "unpublish", "archive"] as const;
export type ContentAction = typeof contentActions[number];
export interface ContentAuditRecord {
  actor: Types.ObjectId; action: ContentAction; resource: ContentKind;
  contentId: Types.ObjectId; revision: number; createdAt: Date;
}
const schema = new Schema<ContentAuditRecord>({
  actor: { type: Schema.Types.ObjectId, required: true },
  action: { type: String, enum: contentActions, required: true },
  resource: { type: String, enum: resources, required: true },
  contentId: { type: Schema.Types.ObjectId, required: true },
  revision: { type: Number, required: true, min: 1, validate: Number.isSafeInteger },
  createdAt: { type: Date, required: true, default: Date.now, immutable: true },
}, { autoCreate: false, autoIndex: false, strict: true });
schema.index({ resource: 1, contentId: 1, revision: 1 }, { unique: true, name: "content_revision_unique" });
schema.index({ actor: 1, createdAt: -1 }, { name: "content_actor_time" });
export const contentAuditDefinition = { name: "ContentAudit", collection: "content_audits", schema };
