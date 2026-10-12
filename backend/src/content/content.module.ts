import { MediaModule } from "../media/media.module";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { contentDefinitions } from "./content.schemas";
import { ContentService } from "./content.service";
import { ContentExceptionFilter } from "./content-exception.filter";
import { ProjectsController, ResearchController, PublicationsController, TeamController, CoursesController } from "./content.controllers";

@Module({
  imports: [MediaModule, MongooseModule.forFeature(Object.values(contentDefinitions))],
  controllers: [ProjectsController, ResearchController, PublicationsController, TeamController, CoursesController],
  providers: [ContentService, ContentExceptionFilter],
})
export class ContentModule {}
