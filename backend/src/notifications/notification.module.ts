import { Module, Controller, Get, Query, UseFilters } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { RequirePermissions, ValidatedQuery } from "../auth/permissions";
import { LeadExceptionFilter } from "../leads/lead.filter";
import { notificationDefinition } from "./notification.schema";
import { NotificationService } from "./notification.service";
@Controller("admin/notifications") @UseFilters(LeadExceptionFilter)
class NotificationController {
  constructor(private readonly notifications: NotificationService) {}
  @Get("status") @RequirePermissions("leads:read") @ValidatedQuery()
  status(@Query() query: Record<string, unknown>) { if (Object.keys(query).length) return this.notifications.list({ unknown: true }); return this.notifications.status(); }
  @Get() @RequirePermissions("leads:read") @ValidatedQuery()
  list(@Query() query: Record<string, unknown>) { return this.notifications.list(query); }
}
@Module({ imports: [MongooseModule.forFeature([notificationDefinition])], controllers: [NotificationController], providers: [NotificationService, LeadExceptionFilter], exports: [NotificationService] })
export class NotificationModule {}
