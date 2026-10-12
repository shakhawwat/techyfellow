import { PublicEndpoint } from "./auth/permissions";
import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { DatabaseService } from "./database.service";

@Controller("health")
export class HealthController {
  constructor(private readonly database: DatabaseService) {}

  @PublicEndpoint()
  @Get("live")
  live(): { status: string } {
    return { status: "ok" };
  }

  @PublicEndpoint()
  @Get("ready")
  async ready(): Promise<{ status: string }> {
    if (!await this.database.isReady()) {
      throw new ServiceUnavailableException({ status: "unavailable" });
    }
    return { status: "ok" };
  }
}
