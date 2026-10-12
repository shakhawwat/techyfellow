import { SetMetadata } from "@nestjs/common";

export const roles = ["SUPER_ADMIN", "CONTENT_EDITOR", "RESEARCH_EDITOR", "ACADEMY_MANAGER", "VIEWER", "SALES_MANAGER", "MEMBER"] as const;
export type Role = typeof roles[number];
export const resources = ["projects", "research", "publications", "team", "courses"] as const;
export const permissions = ["admin:access", "users:admin", "leads:read", "leads:manage", ...resources.flatMap(resource =>
  ["read", "edit", "publish"].map(action => `${resource}:${action}`))] as const;
export type Permission = typeof permissions[number];
const contentPermissions = (items: readonly string[], actions: readonly string[]) =>
  items.flatMap(resource => actions.map(action => `${resource}:${action}`));
const grants: Record<Role, readonly string[]> = {
  MEMBER: [],
  SUPER_ADMIN: permissions,
  SALES_MANAGER: ["admin:access", "leads:read", "leads:manage"],
  CONTENT_EDITOR: ["admin:access", ...contentPermissions(["projects", "team"], ["read", "edit"])],
  RESEARCH_EDITOR: ["admin:access", ...contentPermissions(["research", "publications"], ["read", "edit"])],
  ACADEMY_MANAGER: ["admin:access", ...contentPermissions(["courses"], ["read", "edit"])],
  VIEWER: contentPermissions(resources, ["read"]),
};
export function grantedPermissions(role: string): readonly string[] {
  return Object.hasOwn(grants, role) ? grants[role as Role] : [];
}
export function hasPermission(role: string, permission: string): boolean {
  return permissions.includes(permission) && grantedPermissions(role).includes(permission);
}
export const ACCESS_POLICY = "techyfellow:access-policy";
export type AccessPolicy = { mode: "public" | "authenticated" | "permissions" | "anyPermissions"; permissions?: readonly string[] };
export const PublicEndpoint = () => SetMetadata(ACCESS_POLICY, { mode: "public" } satisfies AccessPolicy);
export const Authenticated = () => SetMetadata(ACCESS_POLICY, { mode: "authenticated" } satisfies AccessPolicy);
export const RequirePermissions = (...required: Permission[]) =>
  SetMetadata(ACCESS_POLICY, { mode: "permissions", permissions: required } satisfies AccessPolicy);

export const VALIDATED_QUERY = "techyfellow:validated-query";
export const ValidatedQuery = () => SetMetadata(VALIDATED_QUERY, true);

export const RequireAnyPermissions = (...required: Permission[]) => SetMetadata(ACCESS_POLICY, { mode: "anyPermissions", permissions: required } satisfies AccessPolicy);
export const MULTIPART_MUTATION = "techyfellow:multipart-mutation";
export const MultipartMutation = () => SetMetadata(MULTIPART_MUTATION, true);
