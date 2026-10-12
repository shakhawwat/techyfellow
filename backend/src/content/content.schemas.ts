import { Schema, type SchemaDefinition } from "mongoose";
import type { ContentKind, ContentRecord } from "./content.types";

export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const researchStages = ["planned", "active", "paused", "completed"] as const;
export const courseLevels = ["beginner", "intermediate", "advanced"] as const;
export const deliveryModes = ["self-paced", "live-online", "in-person", "hybrid"] as const;
export function isPublicUrl(value: string): boolean {
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; }
  catch { return false; }
}
function publicationRequired(this: ContentRecord): boolean { return this.status === "published"; }
const publicationText = (max = 10000) => ({ type: String, required: publicationRequired, trim: true, maxlength: max });
const text = (max = 10000) => ({ type: String, required: true, trim: true, maxlength: max });
const strings = { type: [{ type: String, trim: true, maxlength: 500 }], default: [] };
const url = { type: String, validate: isPublicUrl, maxlength: 2048 };
const nested = { _id: false, strict: true } as const;
const seo = new Schema({ title: { type: String, maxlength: 160 }, description: { type: String, maxlength: 320 }, canonicalUrl: url }, nested);
const media = new Schema({ reference: text(500), type: { type: String, enum: ["image", "video", "document"], required: true }, altText: text(500) }, nested);
const contributor = new Schema({ name: text(160), teamSlug: { type: String, match: slugPattern, maxlength: 160 } }, nested);
const link = new Schema({ label: text(160), url: { ...url, required: true }, approved: { type: Boolean, default: false } }, nested);
const syllabus = new Schema({ title: text(200), topics: strings }, nested);
const duration = new Schema({ value: { type: Number, required: true, min: Number.EPSILON, validate: Number.isFinite }, unit: { type: String, enum: ["hours", "weeks"], required: true } }, nested);

function schema(fields: SchemaDefinition<ContentRecord>, filterIndexes: string[], titleField = "title") {
  const result = new Schema<ContentRecord>({
    slug: { ...text(160), match: slugPattern }, summary: { ...publicationText(2000), default: "" },
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft", required: true },
    publishedAt: { type: Date, required: function(this: ContentRecord) { return this.status === "published"; } },
    revision: { type: Number, default: 1, required: true, min: 1, validate: Number.isSafeInteger },
    seo: { type: seo, default: undefined }, ...fields,
  }, { timestamps: true, strict: true, autoIndex: false, autoCreate: false });
  result.index({ status: 1, updatedAt: -1, slug: 1 }, { name: "admin_status_updated" });
  result.index({ updatedAt: -1, slug: 1 }, { name: "admin_updated" });
  result.index({ slug: 1 }, { unique: true, name: "slug_unique" });
  result.index({ status: 1, publishedAt: -1, slug: 1 }, { name: "public_published_at" });
  result.index({ status: 1, [titleField]: 1, slug: 1, publishedAt: 1 }, { name: "public_title" });
  for (const field of filterIndexes) result.index({ status: 1, [field]: 1, publishedAt: -1, slug: 1 }, { name: `public_${field}` });
  return result;
}

export const contentDefinitions: Record<ContentKind, { name: string; collection: string; schema: Schema<ContentRecord> }> = {
  projects: { name: "Project", collection: "projects", schema: schema({ title: text(200), category: publicationText(100), problem: publicationText(), approach: publicationText(), technologies: strings, results: strings, media: { type: [media], default: [] } }, ["category", "technologies"]) },
  research: { name: "ResearchProject", collection: "research_projects", schema: schema({ title: text(200), domain: publicationText(100), methods: strings, researchStage: { type: String, enum: researchStages, default: "planned", required: true }, contributors: { type: [contributor], default: [] } }, ["domain", "researchStage"]) },
  publications: { name: "Publication", collection: "publications", schema: schema({ title: text(200), authors: { ...strings, required: publicationRequired, validate: function(this: ContentRecord, values: string[]) { return this.status !== "published" || (Array.isArray(values) && values.length > 0); } }, venue: publicationText(200), year: { type: Number, required: publicationRequired, min: 1, max: 9999, validate: Number.isInteger }, doi: { type: String, maxlength: 500, match: /^10\.\d{4,9}\/\S+$/ }, publisherUrl: url }, ["year", "authors", "venue"]) },
  team: { name: "TeamMember", collection: "team_members", schema: schema({ name: text(160), biography: publicationText(), expertise: strings, profileLinks: { type: [link], default: [] } }, ["expertise"], "name") },
  courses: { name: "Course", collection: "courses", schema: schema({ title: text(200), level: { type: String, enum: courseLevels, required: publicationRequired }, prerequisites: strings, syllabus: { type: [syllabus], default: [] }, deliveryMode: { type: String, enum: deliveryModes, required: publicationRequired }, duration: { type: duration, required: publicationRequired } }, ["level", "deliveryMode"]) },
};
