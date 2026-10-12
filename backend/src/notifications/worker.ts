import "reflect-metadata";
import { accountDefinitions, type VerificationRecord, type VerificationJobRecord } from "../account/account.schemas";
import { authDefinitions, type UserRecord } from "../auth/auth.schemas";
import { verificationConfiguration } from "../account/verification-config";
import { VerificationProcessor } from "../account/verification-processor";
import { createConnection, type Connection } from "mongoose";
import { writeFile, unlink } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import { databaseOptions, validateEnvironment } from "../config/environment";
import { leadDefinitions, type LeadRecord } from "../leads/lead.schema";
import { notificationDefinition, type NotificationRecord } from "./notification.schema";
import { emailConfiguration } from "./email.config";
import { ResendEmailProvider } from "./email-provider";
import { NotificationProcessor } from "./processor";
const healthFile = "/tmp/techyfellow-email-worker-health.json";
async function main() {
  let connection: Connection | undefined, stopping = false;
  process.once("SIGTERM", () => { stopping = true; }); process.once("SIGINT", () => { stopping = true; });
  try {
    const env = validateEnvironment(process.env), config = emailConfiguration(env);
    connection = createConnection(env.MONGODB_URI, databaseOptions); connection.on("error", () => undefined); await connection.asPromise();
    const processor = new NotificationProcessor(connection.model<NotificationRecord>(notificationDefinition.name, notificationDefinition.schema, notificationDefinition.collection), connection.model<LeadRecord>(leadDefinitions.lead.name, leadDefinitions.lead.schema, leadDefinitions.lead.collection), config, new ResendEmailProvider(config.apiKey));
    const accountProcessor = new VerificationProcessor(connection.model<VerificationJobRecord>(accountDefinitions.job.name, accountDefinitions.job.schema, accountDefinitions.job.collection), connection.model<VerificationRecord>(accountDefinitions.verification.name, accountDefinitions.verification.schema, accountDefinitions.verification.collection), connection.model<UserRecord>(authDefinitions.user.name, authDefinitions.user.schema, authDefinitions.user.collection), verificationConfiguration(env), new ResendEmailProvider(config.apiKey));
    console.log(`Email worker started: ${config.mode}.`);
    while (!stopping) {
      let healthy = true, idle = true;
      try { await connection.db!.admin().command({ ping: 1 }, { timeoutMS: 1500 }); const result = await processor.processOne(); const accountResult = await accountProcessor.processOne(); idle = (result === "idle" || result === "paused") && (accountResult === "idle" || accountResult === "paused"); }
      catch { healthy = false; console.error("Email worker database operation unavailable; leased work remains recoverable."); }
      await writeFile(healthFile, JSON.stringify({ healthy, mode: config.mode, at: Date.now() }), { mode: 0o600 });
      if (idle || !healthy) await delay(5000);
    }
  } catch { console.error("Email worker startup failed; verify backend configuration and database access."); process.exitCode = 1; }
  finally { await unlink(healthFile).catch(() => undefined); await connection?.close().catch(() => { process.exitCode = 1; }); }
}
void main();
