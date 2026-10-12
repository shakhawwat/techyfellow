import { createConnection, type Connection } from "mongoose";
import { databaseOptions, validateEnvironment } from "../config/environment";
import { authDefinitions, normalizeEmail, validEmail } from "./auth.schemas";
import { hashPassword, validBootstrapPassword } from "./password";

async function main(): Promise<void> {
  let connection: Connection | undefined;
  try {
    const config = validateEnvironment(process.env);
    const email = typeof process.env.BOOTSTRAP_ADMIN_EMAIL === "string" ? normalizeEmail(process.env.BOOTSTRAP_ADMIN_EMAIL) : "";
    const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
    if (!validEmail(email) || !validBootstrapPassword(password)) throw new Error("Invalid bootstrap input");
    // Explicit operator command only; neither imported nor invoked by startup.
    connection = createConnection(config.MONGODB_URI, databaseOptions);
    connection.on("error", () => undefined);
    await connection.asPromise();
    const users = connection.model(authDefinitions.user.name, authDefinitions.user.schema, authDefinitions.user.collection);
    await users.createIndexes();
    if (await users.exists({ email: { $eq: email } })) throw new Error("Existing user");
    // Unique index also protects concurrent bootstrap commands. No upsert/update/elevation.
    await users.create({ email, passwordHash: await hashPassword(password), role: "SUPER_ADMIN", enabled: true });
    console.log("Bootstrap administrator created.");
  } catch {
    console.error("Bootstrap refused or failed; verify environment, database access and that the normalized user does not already exist.");
    process.exitCode = 1;
  } finally {
    try { await connection?.close(); } catch {
      console.error("Database cleanup failed."); process.exitCode = 1;
    }
  }
}
void main();
