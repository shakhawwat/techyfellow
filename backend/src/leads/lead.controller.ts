import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseFilters } from "@nestjs/common";
import { PublicEndpoint, RequirePermissions, ValidatedQuery } from "../auth/permissions";
import type { AuthRequest } from "../auth/auth-http";
import { LeadService } from "./lead.service";
import { LeadExceptionFilter } from "./lead.filter";
import { invalid } from "./lead-input";
@Controller("leads") @UseFilters(LeadExceptionFilter)
export class PublicLeadController {
  constructor(private readonly leads: LeadService) {}
  @Post() @PublicEndpoint()
  submit(@Body() body: unknown, @Req() request: AuthRequest) { if (Object.keys(request.query).length) return invalid("query"); return this.leads.submit(body, request.get("Idempotency-Key"), request.ip ?? request.socket.remoteAddress ?? "unknown"); }
}
@Controller("admin/leads") @UseFilters(LeadExceptionFilter)
export class AdminLeadController {
  constructor(private readonly leads: LeadService) {}
  @Get() @RequirePermissions("leads:read") @ValidatedQuery()
  list(@Query() query: Record<string, unknown>, @Req() request: AuthRequest) { return this.leads.list(query, request.auth!.user); }
  @Get("owners") @RequirePermissions("leads:manage") @ValidatedQuery()
  owners(@Query() query: Record<string, unknown>, @Req() request: AuthRequest) { return this.leads.owners(query, request.auth!.user); }
  @Get(":id") @RequirePermissions("leads:read")
  detail(@Param("id") id: string, @Req() request: AuthRequest) { return this.leads.detail(id, request.auth!.user); }
  @Patch(":id") @RequirePermissions("leads:manage")
  update(@Param("id") id: string, @Body() body: unknown, @Req() request: AuthRequest) { return this.leads.update(id, body, request.auth!.user); }
}
