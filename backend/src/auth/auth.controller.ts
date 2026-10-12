import { Body, Controller, Get, Header, HttpCode, Post, Req, Res, UseFilters, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Response } from "express";
import { Authenticated, grantedPermissions, PublicEndpoint, RequirePermissions } from "./permissions";
import { AuthService } from "./auth.service";
import { AuthExceptionFilter } from "./auth-exception.filter";
import { clearSessionCookie, cookieName, cookieOptions, readSessionToken, type AuthRequest } from "./auth-http";

@Controller("auth")
@UseFilters(AuthExceptionFilter)
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly config: ConfigService) {}
  @Post("login") @PublicEndpoint() @HttpCode(200) @Header("Cache-Control", "no-store")
  async login(@Body() body: unknown, @Req() request: AuthRequest, @Res({ passthrough: true }) response: Response) {
    if (Object.keys(request.query).length) { await this.auth.audit("login", "invalid_request"); throw new BadRequestException(); }
    const production = this.config.get("NODE_ENV") === "production";
    const result = await this.auth.login(body, request.ip ?? request.socket.remoteAddress ?? "unknown", readSessionToken(request, production));
    response.cookie(cookieName(production), result.token, { ...cookieOptions(production), expires: result.expiresAt });
    return { data: { user: result.user } };
  }
  @Post("logout") @Authenticated() @HttpCode(200)
  async logout(@Req() request: AuthRequest, @Res({ passthrough: true }) response: Response) {
    const { sessionId, user } = request.auth!;
    await this.auth.logout(sessionId, user.id);
    clearSessionCookie(response, this.config.get("NODE_ENV") === "production");
    return { data: { loggedOut: true } };
  }
  @Get("me") @Authenticated()
  me(@Req() request: AuthRequest) { return { data: { user: request.auth!.user } }; }
}
@Controller("admin")
@UseFilters(AuthExceptionFilter)
export class AdminAccessController {
  @Get("access") @RequirePermissions("admin:access")
  access(@Req() request: AuthRequest) {
    return { data: { user: request.auth!.user, permissions: grantedPermissions(request.auth!.user.role) } };
  }
}
