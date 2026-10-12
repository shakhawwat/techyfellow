import { BadRequestException } from "@nestjs/common";
import { parsePublicQuery } from "../content/public-query";
import { slugPattern } from "../content/content.schemas";
import type { ContentKind, EditorialStatus } from "../content/content.types";
export function parseAdminQuery(kind: ContentKind, raw: Record<string, unknown>) {
  const { status, slug, sort, q, ...rest } = raw;
  const parsed = parsePublicQuery(kind, rest);
  if(q!==undefined){if(kind!=='courses'||typeof q!=='string'||q.length>160)throw new BadRequestException();if(q.trim()){const escaped=q.trim().replace(/[.*+?^${}()|[\]\\]/g,'\\$&');parsed.filter.$or=[{title:{$regex:escaped,$options:'i'}},{slug:{$regex:escaped,$options:'i'}}];}}
  delete parsed.filter.status;
  delete parsed.filter.publishedAt;
  if (status !== undefined) {
    if (typeof status !== "string" || !["draft", "published", "archived"].includes(status)) throw new BadRequestException();
    parsed.filter.status = { $eq: status as EditorialStatus };
  }
  if (slug !== undefined) {
    if (typeof slug !== "string" || slug.length > 160 || !slugPattern.test(slug)) throw new BadRequestException();
    parsed.filter.slug = { $eq: slug };
  }
  const value = sort ?? "-updatedAt";
  if (typeof value !== "string") throw new BadRequestException();
  const field = value.startsWith("-") ? value.slice(1) : value;
  if (!["slug", "createdAt", "updatedAt", "publishedAt", "revision", kind === "team" ? "name" : "title", ...(kind === "publications" ? ["year"] : [])].includes(field)) throw new BadRequestException();
  parsed.sort = field === "slug" ? { slug: value.startsWith("-") ? -1 : 1 } : { [field]: value.startsWith("-") ? -1 : 1, slug: 1 };
  return parsed;
}
