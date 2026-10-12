import { ServiceUnavailableException } from "@nestjs/common";
import type { ContentKind, ContentRecord, PublicContentDto, Seo } from "./content.types";
import { isPublicUrl } from "./content.schemas";

const fields: Record<ContentKind, string[]> = {
  projects: ["title", "category", "problem", "approach", "technologies", "results", "media"],
  research: ["title", "domain", "methods", "researchStage", "contributors"],
  publications: ["title", "authors", "venue", "year", "doi", "publisherUrl"],
  team: ["name", "biography", "expertise", "profileLinks"],
  courses: ["title", "level", "prerequisites", "syllabus", "deliveryMode", "duration"],
};
export function publicProjection(kind: ContentKind): Record<string, 0 | 1> {
  return Object.fromEntries([...["slug", "summary", "publishedAt", "seo", ...fields[kind]].map(field => [field, 1]), ["_id", 0]]);
}
function required<T>(value: T | undefined): T {
  if (value === undefined || value === null) throw new ServiceUnavailableException();
  return value;
}
function publicSeo(seo?: Seo): Seo | undefined {
  if (!seo) return undefined;
  return { title: seo.title, description: seo.description, canonicalUrl: seo.canonicalUrl && isPublicUrl(seo.canonicalUrl) ? seo.canonicalUrl : undefined };
}
export function toPublicDto(kind: ContentKind, record: ContentRecord): PublicContentDto {
  const common = { slug: record.slug, summary: record.summary, publishedAt: required(record.publishedAt).toISOString(), seo: publicSeo(record.seo) };
  switch (kind) {
    case "projects": return { ...common, title: required(record.title), category: required(record.category), problem: required(record.problem), approach: required(record.approach), technologies: record.technologies ?? [], results: record.results ?? [], media: (record.media ?? []).map(item => ({ reference: item.reference, type: item.type, altText: item.altText })) };
    case "research": return { ...common, title: required(record.title), domain: required(record.domain), methods: record.methods ?? [], researchStage: required(record.researchStage), contributors: (record.contributors ?? []).map(person => ({ name: person.name, teamSlug: person.teamSlug })) };
    case "publications": return { ...common, title: required(record.title), authors: record.authors ?? [], venue: required(record.venue), year: required(record.year), doi: record.doi, publisherUrl: record.publisherUrl && isPublicUrl(record.publisherUrl) ? record.publisherUrl : undefined };
    case "team": return { ...common, name: required(record.name), biography: required(record.biography), expertise: record.expertise ?? [], profileLinks: (record.profileLinks ?? []).filter(link => link.approved === true && isPublicUrl(link.url)).map(link => ({ label: link.label, url: link.url })) };
    case "courses": { const duration = required(record.duration); return { ...common, title: required(record.title), level: required(record.level), prerequisites: record.prerequisites ?? [], syllabus: (record.syllabus ?? []).map(item => ({ title: item.title, topics: item.topics })), deliveryMode: required(record.deliveryMode), duration: { value: duration.value, unit: duration.unit } }; }
  }
}
