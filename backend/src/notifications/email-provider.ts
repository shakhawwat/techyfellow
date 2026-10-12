import type { EmailMessage } from "./notification.schema";
export interface EmailProvider { send(message: EmailMessage, idempotencyKey: string): Promise<void> }
export class EmailProviderError extends Error {
  constructor(public readonly code: "provider_transient" | "provider_rejected" | "provider_unconfirmed", public readonly retryable: boolean) { super(code); }
}
export class ResendEmailProvider implements EmailProvider {
  constructor(private readonly apiKey: string, private readonly transport: typeof fetch = (input, init) => fetch(input, init)) {}
  async send(message: EmailMessage, idempotencyKey: string): Promise<void> {
    let response: Response;
    try { response = await this.transport("https://api.resend.com/emails", { method: "POST", redirect: "error", signal: AbortSignal.timeout(10000), headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey }, body: JSON.stringify(message) }); }
    catch { throw new EmailProviderError("provider_unconfirmed", true); }
    if (!response.ok) throw new EmailProviderError(response.status === 429 || response.status >= 500 ? "provider_transient" : "provider_rejected", response.status === 429 || response.status >= 500);
    try { const body: unknown = await response.json(); if (!body || typeof body !== "object" || !("id" in body) || typeof body.id !== "string" || !body.id) throw Error(); }
    catch { throw new EmailProviderError("provider_unconfirmed", true); }
  }
}
