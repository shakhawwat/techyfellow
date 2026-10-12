export type ContentKind = "projects" | "research" | "publications" | "team" | "courses";
export type EditorialStatus = "draft" | "published" | "archived";
export type Seo = { title?: string; description?: string; canonicalUrl?: string };
export type MediaReference = { reference: string; type: "image" | "video" | "document"; altText: string; url?: string; width?: number; height?: number; mimeType?: string };
export type Contributor = { name: string; teamSlug?: string };
export type ProfileLink = { label: string; url: string; approved: boolean };
export type SyllabusItem = { title: string; topics: string[] };
export type Duration = { value: number; unit: "hours" | "weeks" };

// Shared storage contract; each collection schema enforces its own required fields.
export interface ContentRecord {
  slug: string;
  title?: string;
  name?: string;
  summary: string;
  status: EditorialStatus;
  revision?: number;
  publishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  seo?: Seo;
  category?: string;
  problem?: string;
  approach?: string;
  technologies?: string[];
  results?: string[];
  media?: MediaReference[];
  domain?: string;
  methods?: string[];
  researchStage?: "planned" | "active" | "paused" | "completed";
  contributors?: Contributor[];
  authors?: string[];
  venue?: string;
  year?: number;
  doi?: string;
  publisherUrl?: string;
  biography?: string;
  expertise?: string[];
  profileLinks?: ProfileLink[];
  level?: "beginner" | "intermediate" | "advanced";
  prerequisites?: string[];
  syllabus?: SyllabusItem[];
  deliveryMode?: "self-paced" | "live-online" | "in-person" | "hybrid";
  duration?: Duration;
}

export interface CommonPublicDto { slug: string; summary: string; publishedAt: string; seo?: Seo }
export interface ProjectPublicDto extends CommonPublicDto {
  title: string; category: string; problem: string; approach: string;
  technologies: string[]; results: string[]; media: MediaReference[];
}
export interface ResearchPublicDto extends CommonPublicDto {
  title: string; domain: string; methods: string[];
  researchStage: NonNullable<ContentRecord["researchStage"]>; contributors: Contributor[];
}
export interface PublicationPublicDto extends CommonPublicDto {
  title: string; authors: string[]; venue: string; year: number; doi?: string; publisherUrl?: string;
}
export interface TeamPublicDto extends CommonPublicDto {
  name: string; biography: string; expertise: string[]; profileLinks: { label: string; url: string }[];
}
export interface CoursePublicDto extends CommonPublicDto {
  title: string; level: NonNullable<ContentRecord["level"]>; prerequisites: string[];
  syllabus: SyllabusItem[]; deliveryMode: NonNullable<ContentRecord["deliveryMode"]>; duration: Duration;
}
export type PublicContentDto = ProjectPublicDto | ResearchPublicDto | PublicationPublicDto | TeamPublicDto | CoursePublicDto;
export type PublicListDto = { data: PublicContentDto[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
