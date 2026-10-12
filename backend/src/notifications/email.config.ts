import { validEmail } from "../auth/auth.schemas";
export type EmailMode = "enabled" | "disabled" | "unconfigured";
export interface EmailConfiguration { mode: EmailMode; missingFields: string[]; apiKey: string; from: string; recipients: string[]; adminBaseUrl: string }
export function emailConfiguration(env: Record<string, unknown>): EmailConfiguration {
  const flag = String(env.EMAIL_ENABLED ?? "false");
  if (!["true", "false"].includes(flag)) throw new Error("EMAIL_ENABLED must be true or false");
  const value = (key: string) => typeof env[key] === "string" ? env[key].trim() : "";
  const apiKey = value("RESEND_API_KEY"), from = value("EMAIL_FROM"), to = value("LEAD_NOTIFICATION_TO"), adminBaseUrl = value("ADMIN_BASE_URL").replace(/\/$/, "");
  const recipients = [...new Set(to.split(",").map(email => email.trim()).filter(Boolean))];
  const missingFields: string[] = [];
  if (!apiKey || /[\s\x00-\x1f\x7f]/.test(apiKey)) missingFields.push("RESEND_API_KEY");
  if (!validEmail(from) || /[\r\n]/.test(from)) missingFields.push("EMAIL_FROM");
  if (!recipients.length || recipients.length > 10 || recipients.some(email => !validEmail(email) || /[\r\n]/.test(email))) missingFields.push("LEAD_NOTIFICATION_TO");
  try { const url = new URL(adminBaseUrl), local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (url.username || url.password || url.search || url.hash || url.pathname !== "/admin" || (url.protocol !== "https:" && !(env.NODE_ENV !== "production" && local && url.protocol === "http:"))) throw Error();
  } catch { missingFields.push("ADMIN_BASE_URL"); }
  return { mode: flag === "false" ? "disabled" : missingFields.length ? "unconfigured" : "enabled", missingFields, apiKey, from, recipients, adminBaseUrl };
}
export const emailOperationalStatus = (config: EmailConfiguration) => ({ mode: config.mode, missingFields: config.mode === "unconfigured" ? config.missingFields : [] });
