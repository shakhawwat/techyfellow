import { createConnection, type Connection } from "mongoose";
import { databaseOptions, validateEnvironment } from "../config/environment";
import { authDefinitions, normalizeEmail, validEmail } from "./auth.schemas";
import { hashPassword, validBootstrapPassword } from "./password";
// Explicit database-operator command only. Refuses updates or elevation of an existing account.
async function main() {
  let connection: Connection | undefined;
  try {
    const config = validateEnvironment(process.env), email = typeof process.env.SALES_MANAGER_EMAIL === "string" ? normalizeEmail(process.env.SALES_MANAGER_EMAIL) : "", password = process.env.SALES_MANAGER_PASSWORD;
    if (!validEmail(email) || !validBootstrapPassword(password)) throw new Error();
    connection = createConnection(config.MONGODB_URI, databaseOptions); connection.on("error", () => undefined); await connection.asPromise();
    const users = connection.model(authDefinitions.user.name, authDefinitions.user.schema, authDefinitions.user.collection); await users.createIndexes();
    if (await users.exists({ email: { $eq: email } })) throw new Error();
    await users.create({ email, passwordHash: await hashPassword(password), role: "SALES_MANAGER", enabled: true });
    console.log("Sales manager created.");
  } catch { console.error("Sales manager creation refused or failed; verify configuration, database access and that the normalized account does not exist."); process.exitCode = 1; }
  finally { try { await connection?.close(); } catch { console.error("Database cleanup failed."); process.exitCode = 1; } }
}
void main();
