import { createHash } from "node:crypto";
import type { Request, Response, CookieOptions } from "express";
import type { Role } from "./permissions";

export interface AuthIdentity { id: string; email: string; role: Role }
export interface AuthRequest extends Request {
  auth?: { user: AuthIdentity; sessionId: string };
}
export const hashToken = (token: string): string => createHash("sha256").update(token).digest("hex");
export function cookieName(production: boolean): string {
  return production ? "__Host-techyfellow_session" : "techyfellow_session";
}
export function cookieOptions(production: boolean): CookieOptions {
  return { httpOnly: true, secure: production, sameSite: "lax", path: "/" };
}
export function readSessionToken(request: Request, production: boolean): string | undefined {
  const entries = (request.headers.cookie ?? "").split(";").map(entry => entry.trim());
  const prefix = `${cookieName(production)}=`;
  const values = entries.filter(entry => entry.startsWith(prefix)).map(entry => entry.slice(prefix.length));
  return values.length === 1 && /^[A-Za-z0-9_-]{43}$/.test(values[0]) ? values[0] : undefined;
}
export function clearSessionCookie(response: Response, production: boolean): void {
  response.clearCookie(cookieName(production), cookieOptions(production));
}
