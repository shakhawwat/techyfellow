import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { authDefinitions } from "./auth.schemas";
import { AuthService } from "./auth.service";
import { AccessGuard } from "./access.guard";
import { AuthController, AdminAccessController } from "./auth.controller";
import { AuthExceptionFilter } from "./auth-exception.filter";
@Module({
  imports: [MongooseModule.forFeature(Object.values(authDefinitions))],
  controllers: [AuthController, AdminAccessController],
  exports: [AuthService],
  providers: [AuthService, AuthExceptionFilter, { provide: APP_GUARD, useClass: AccessGuard }],
})
export class AuthModule {}
