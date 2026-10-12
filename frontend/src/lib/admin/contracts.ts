export const resources = ["projects", "research", "publications", "team", "courses"] as const;
export type Resource = typeof resources[number];
export const labels: Record<Resource, string> = { projects: "Projects", research: "Research", publications: "Publications", team: "Team", courses: "Courses" };
export const roles = ["SUPER_ADMIN", "CONTENT_EDITOR", "RESEARCH_EDITOR", "ACADEMY_MANAGER", "VIEWER", "SALES_MANAGER"] as const;
export type Role = typeof roles[number];
export type User = { id: string; email: string; role: Role };
export type SessionUser = { id: string; email: string; role: Role | "MEMBER" };
export type ContentRecord = { id: string; slug: string; title?: string; name?: string; status: "draft" | "published" | "archived"; revision: number; createdAt?: string; updatedAt?: string; publishedAt?: string; [key: string]: unknown };
export type ContentList = { data: ContentRecord[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
export function isResource(value: string): value is Resource { return resources.includes(value as Resource); }
export function checkedSessionUser(value: SessionUser): SessionUser {
  if (!value || !/^[a-f0-9]{24}$/.test(value.id) || typeof value.email !== "string" || !(roles as readonly string[]).concat("MEMBER").includes(value.role)) throw new Error("Invalid session response");
  return value;
}
export function checkedUser(value: User): User {
  checkedSessionUser(value);
  if (!roles.includes(value.role)) throw new Error("Invalid admin session response");
  return value;
}
export function checkedRecord(value: ContentRecord): ContentRecord {
  if (!value || !/^[a-f0-9]{24}$/.test(value.id) || typeof value.slug !== "string" || !["draft", "published", "archived"].includes(value.status) || !Number.isSafeInteger(value.revision) || value.revision < 1) throw new Error("Invalid content response");
  return value;
}
