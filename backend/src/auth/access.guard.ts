import { BadRequestException, ForbiddenException, Injectable, type CanActivate, type ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import type { Response } from "express";
import { ACCESS_POLICY, VALIDATED_QUERY, MULTIPART_MUTATION, hasPermission, type AccessPolicy } from "./permissions";
import { readSessionToken, type AuthRequest } from "./auth-http";
import { AuthService } from "./auth.service";

@Injectable()
export class AccessGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly config: ConfigService, private readonly auth: AuthService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policy = this.reflector.getAllAndOverride<AccessPolicy>(ACCESS_POLICY, [context.getHandler(), context.getClass()]);
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const response = context.switchToHttp().getResponse<Response>();
    const mutation = !["GET", "HEAD", "OPTIONS"].includes(request.method);
    // Public GETs stay unchanged. Every mutation, including public login, requires CSRF defenses.
    if (policy?.mode !== "public" || mutation) {
      response.setHeader("Cache-Control", "no-store");
      const origin = request.get("Origin");
      const allowed = this.config.getOrThrow<string[]>("AUTH_ALLOWED_ORIGINS");
      const multipart = this.reflector.get<boolean>(MULTIPART_MUTATION, context.getHandler()) === true;
      const denied = (origin !== undefined && !allowed.includes(origin)) ||
        (mutation && (!origin || request.get("X-CSRF-Protection") !== "1" || !(multipart ? request.is("multipart/form-data") : request.is("application/json"))));
      if (denied) {
        if (request.method === "POST") {
          const event = request.path === "/api/v1/account/register" ? "register" : request.path === "/api/v1/account/verify-email" ? "verify_email" : "login";
          if (["/api/v1/auth/login", "/api/v1/account/login", "/api/v1/account/register", "/api/v1/account/verify-email"].includes(request.path)) await this.auth.audit(event, "csrf_rejected");
        }
        throw new ForbiddenException();
      }
    }
    if (policy?.mode === "public") return true;
    request.auth = await this.auth.authenticate(readSessionToken(request, this.config.get("NODE_ENV") === "production"));
    // Missing metadata never grants access, including SUPER_ADMIN.
    if (!policy || !["authenticated", "permissions", "anyPermissions"].includes(policy.mode) || (policy.mode === "permissions" && (!policy.permissions?.length ||
      !policy.permissions.every(permission => hasPermission(request.auth!.user.role, permission)))) ||
      (policy.mode === "anyPermissions" && !policy.permissions?.some(permission => hasPermission(request.auth!.user.role, permission)))) throw new ForbiddenException();
    const allowsQuery = this.reflector.getAllAndOverride<boolean>(VALIDATED_QUERY, [context.getHandler(), context.getClass()]) === true;
    if (!allowsQuery && Object.keys(request.query).length) throw new BadRequestException();
    return true;
  }
}
