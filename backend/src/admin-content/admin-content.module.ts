import { MediaModule } from "../media/media.module";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { contentDefinitions } from "../content/content.schemas";
import { contentAuditDefinition } from "./content-audit.schema";
import { AdminContentService } from "./admin-content.service";
import { AdminExceptionFilter } from "./admin-exception.filter";
import { adminContentControllers } from "./admin-content.controllers";
@Module({
  imports: [MediaModule, MongooseModule.forFeature([...Object.values(contentDefinitions), contentAuditDefinition])],
  controllers: adminContentControllers,
  providers: [AdminContentService, AdminExceptionFilter],
  exports: [AdminContentService],
})
export class AdminContentModule {}
