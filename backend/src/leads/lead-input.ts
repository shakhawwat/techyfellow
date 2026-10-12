import { BadRequestException, HttpException } from "@nestjs/common";
import { normalizeEmail, validEmail } from "../auth/auth.schemas";
import { inquiryTypes, leadStatuses, type InquiryType } from "./lead.schema";
export const leadFields: Record<InquiryType, readonly string[]> = {
  engineering: ["projectType", "problem", "budgetRange", "timeline", "description"],
  research: ["domain", "currentStage", "expectedDeliverable", "availableDataHardware"],
  mentorship: ["university", "department", "area", "teamSize", "stage", "requestedHelp"],
  institutional: ["institution", "participantCount", "topics", "date", "deliveryMode", "location"],
  training: ["institution", "participantCount", "topics", "date", "deliveryMode", "location"],
  "course-interest": ["course", "cohort", "experienceLevel", "contactPreference"], contact: ["message"],
};
const required: Record<InquiryType, string> = { engineering: "problem", research: "domain", mentorship: "requestedHelp", institutional: "institution", training: "topics", "course-interest": "course", contact: "message" };
export function invalid(field: string): never { throw new BadRequestException({ fields: [field] }); }
function object(body: unknown): Record<string, unknown> { if (!body || typeof body !== "object" || Array.isArray(body)) return invalid("body"); return body as Record<string, unknown>; }
export function leadId(value: unknown, field = "id"): string { if (typeof value !== "string" || !/^[a-fA-F0-9]{24}$/.test(value)) return invalid(field); return value.toLowerCase(); }
function text(value: unknown, field: string, max: number, mandatory = false): string | undefined {
  if (value === undefined && !mandatory) return;
  if (typeof value !== "string" || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) return invalid(field);
  const clean = value.trim(); if (mandatory && !clean) return invalid(field); return clean || undefined;
}
export function parseInquiry(body: unknown) {
  if (Buffer.byteLength(JSON.stringify(body) ?? "") > 16384) throw new HttpException("Payload too large", 413);
  const raw = object(body), type = raw.type as InquiryType;
  if (!inquiryTypes.includes(type)) return invalid("type");
  const allowed = ["type", "name", "email", "phone", "organization", "consent", "marketingConsent", "source", "website", ...leadFields[type]];
  for (const key of Object.keys(raw)) if (!allowed.includes(key)) return invalid("body");
  const name = text(raw.name, "name", 120, true)!;
  const email = normalizeEmail(text(raw.email, "email", 254, true)!); if (!validEmail(email)) return invalid("email");
  const phone = text(raw.phone, "phone", 40); if (phone && !/^[+\d][\d ().-]{5,39}$/.test(phone)) return invalid("phone");
  const organization = text(raw.organization, "organization", 200);
  if (raw.consent !== true) return invalid("consent");
  if (raw.marketingConsent !== undefined && typeof raw.marketingConsent !== "boolean") return invalid("marketingConsent");
  // Do not fake acknowledgment for a honeypot. Rejection persists no lead and returns no reference.
  if (text(raw.website, "website", 200)) return invalid("website");
  const source = raw.source ?? "website"; if (typeof source !== "string" || !["website", "solutions", "research", "academy", "institutional", "contact"].includes(source)) return invalid("source");
  const payload: Record<string, string | number> = {};
  for (const field of leadFields[type]) {
    if (["teamSize", "participantCount"].includes(field)) {
      const value = raw[field]; if (value === undefined) continue;
      if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1 || value > 10000) return invalid(field); payload[field] = value;
    } else {
      const value = text(raw[field], field, ["problem", "description", "requestedHelp", "message", "availableDataHardware", "expectedDeliverable"].includes(field) ? 4000 : field === "topics" ? 2000 : 200, field === required[type]);
      if (value === undefined) continue;
      if (field === "date" && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value)) return invalid(field);
      if (field === "deliveryMode" && !["online", "offline", "hybrid", "to-discuss"].includes(value)) return invalid(field);
      if (field === "contactPreference" && !["email", "phone"].includes(value)) return invalid(field);
      if (field === "contactPreference" && value === "phone" && !phone) return invalid("phone");
      if (field === "course" && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) return invalid(field);
      payload[field] = value;
    }
  }
  return { type, name, email, ...(phone ? { phone } : {}), ...(organization ? { organization } : {}), payload, consent: true, marketingConsent: raw.marketingConsent === true, source };
}
export function parseLeadUpdate(body: unknown) {
  const raw = object(body);
  if (Object.keys(raw).some(key => !["revision", "status", "ownerId", "note"].includes(key))) return invalid("body");
  if (typeof raw.revision !== "number" || !Number.isSafeInteger(raw.revision) || raw.revision < 1 || raw.revision >= Number.MAX_SAFE_INTEGER) return invalid("revision");
  const status = raw.status; if (status !== undefined && !leadStatuses.includes(status as typeof leadStatuses[number])) return invalid("status");
  const ownerId = raw.ownerId === undefined || raw.ownerId === null ? raw.ownerId : leadId(raw.ownerId, "ownerId");
  const note = raw.note === undefined ? undefined : text(raw.note, "note", 4000, true);
  if (status === undefined && ownerId === undefined && note === undefined) return invalid("body");
  return { revision: raw.revision, status: status as typeof leadStatuses[number] | undefined, ownerId, note };
}
export function parseLeadQuery(raw: Record<string, unknown>) {
  if (Object.keys(raw).some(k => !["page", "limit", "sort", "type", "status", "ownerId", "reference"].includes(k))) return invalid("query");
  function number(value: unknown, fallback: number, max: number) { if (value === undefined) return fallback; if (typeof value !== "string" || !/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) > max) return invalid("query"); return Number(value); }
  const page = number(raw.page, 1, Number.MAX_SAFE_INTEGER), limit = number(raw.limit, 20, 100), skip = (page - 1) * limit; if (!Number.isSafeInteger(skip)) return invalid("page");
  const sortValue = raw.sort ?? "-createdAt"; if (typeof sortValue !== "string" || !["createdAt", "-createdAt", "updatedAt", "-updatedAt"].includes(sortValue)) return invalid("sort");
  const filter: Record<string, unknown> = {};
  for (const [field, choices] of [["type", inquiryTypes], ["status", leadStatuses]] as const) { if (raw[field] === undefined) continue; if (typeof raw[field] !== "string" || !(choices as readonly string[]).includes(raw[field])) return invalid(field); filter[field] = { $eq: raw[field] }; }
  if (raw.ownerId !== undefined) filter.ownerId = raw.ownerId === "unassigned" ? null : { $eq: leadId(raw.ownerId, "ownerId") };
  if (raw.reference !== undefined) { if (typeof raw.reference !== "string" || !/^TF-[A-F0-9]{24}$/.test(raw.reference)) return invalid("reference"); filter.reference = { $eq: raw.reference }; }
  const field = sortValue.replace(/^-/, ""); const sort: Record<string, 1 | -1> = { [field]: sortValue.startsWith("-") ? -1 : 1, _id: 1 };
  return { page, limit, skip, filter, sort };
}
