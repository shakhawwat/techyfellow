import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";
import { databaseOptions } from "./config/environment";

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private retryTimer?: ReturnType<typeof setInterval>;
  private connectedOnce = false;
  private retrying = false;
  private stopping = false;
  private readonly onConnected = () => { this.connectedOnce = true; };

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly config: ConfigService,
  ) {}

  onModuleInit(): void {
    this.connectedOnce = this.connection.readyState === 1;
    this.connection.on("connected", this.onConnected);
    // The driver recovers established connections; retry initial failures separately.
    this.retryTimer = setInterval(() => { void this.retryInitialConnection(); }, 2000);
    this.retryTimer.unref();
  }

  onModuleDestroy(): void {
    this.stopping = true;
    if (this.retryTimer) clearInterval(this.retryTimer);
    this.connection.off("connected", this.onConnected);
  }

  private async retryInitialConnection(): Promise<void> {
    if (this.stopping || this.connectedOnce || this.retrying || this.connection.readyState !== 0) return;
    this.retrying = true;
    try {
      await this.connection.openUri(this.config.getOrThrow<string>("MONGODB_URI"), databaseOptions);
    } catch {
      // Do not log driver errors: they can contain credentials or connection details.
    } finally {
      this.retrying = false;
    }
  }

  async isReady(): Promise<boolean> {
    if (this.connection.readyState !== 1 || !this.connection.db) return false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const result = await Promise.race([
        this.connection.db.admin().command({ ping: 1, maxTimeMS: 1000 }, { timeoutMS: 1500 }),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error("Database ping timed out")), 2000);
        }),
      ]);
      return result.ok === 1;
    } catch {
      return false;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}
