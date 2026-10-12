import { z } from 'zod';
import type { InquiryPayload } from './schema';
const acknowledgment = z.strictObject({ data: z.strictObject({ reference: z.string().regex(/^TF-[A-F0-9]{24}$/), status: z.literal('received') }) });
export type InquiryReceipt = z.infer<typeof acknowledgment>['data'];
export class InquiryFailure extends Error {
  constructor(public readonly status: number, message: string, public readonly fields: string[] = [], public readonly retryAfterSeconds = 0) { super(message); }
}
export function inquiryApiBase(): string {
  const value = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api/v1'; if (value === '/api/v1') return value;
  try { const url = new URL(value), local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if (url.username || url.password || url.search || url.hash || !['/api/v1', '/api/v1/'].includes(url.pathname) || (url.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production' && local && url.protocol === 'http:'))) throw Error();
    return value.replace(/\/$/, '');
  } catch { throw new InquiryFailure(0, 'Inquiry submission is unavailable because the API address is not configured correctly.'); }
}
export class InquiryDelivery {
  // Per-mounted-form memory only: retained across unchanged or restored-payload retries, never browser storage/URLs/logs.
  private readonly attempts = new Map<string, string>();
  private active?: { body: string; promise: Promise<InquiryReceipt> };
  constructor(private readonly fetcher: typeof fetch = (input, init) => fetch(input, init), private readonly makeKey = () => crypto.randomUUID(), private readonly base = inquiryApiBase) {}
  separate(payload: InquiryPayload) { if (!this.active) this.attempts.delete(JSON.stringify(payload)); }
  clear() { if (!this.active) this.attempts.clear(); }
  submit(payload: InquiryPayload): Promise<InquiryReceipt> {
    const body = JSON.stringify(payload);
    if (this.active) return this.active.body === body ? this.active.promise : Promise.reject(new InquiryFailure(0, 'Wait for the current inquiry request to finish before changing its submission.'));
    let key = this.attempts.get(body);
    try { if (!key) { key = this.makeKey(); this.attempts.set(body, key); } } catch { return Promise.reject(new InquiryFailure(0, 'Secure inquiry submission is unavailable. Use this site over HTTPS or localhost.')); }
    const promise = this.deliver(body, key).then(value => { this.active = undefined; return value; }, error => { this.active = undefined; throw error; }); this.active = { body, promise }; return promise;
  }
  private async deliver(body: string, key: string): Promise<InquiryReceipt> {
    let response: Response;
    try { response = await this.fetcher(this.base() + '/leads', { method: 'POST', credentials: 'omit', cache: 'no-store', redirect: 'error', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(15000), headers: { 'Content-Type': 'application/json', 'X-CSRF-Protection': '1', 'Idempotency-Key': key }, body }); }
    catch (error) { if (error instanceof InquiryFailure) throw error; throw new InquiryFailure(0, 'We could not confirm receipt. Your input has been kept. Retry without changing the details to avoid duplicating an unconfirmed inquiry.'); }
    const messages: Record<number, string> = {
      400: 'Check the highlighted fields. Your inquiry has not been confirmed.', 403: 'This request was not accepted from the current site. Your input has been kept.',
      409: 'This retry conflicts with an earlier inquiry. Your input has been kept. Review the details before starting a separate inquiry.',
      413: 'The inquiry is too long. Shorten optional context before retrying.', 429: 'Too many inquiries. Wait before retrying; your input has been kept.',
      503: 'Inquiry submission is temporarily unavailable. Your input has been kept; receipt has not been confirmed.',
    };
    if (!response.ok) {
      let fields: string[] = []; try { const result = await response.json(); if (Array.isArray(result?.error?.fields)) fields = result.error.fields.filter((field: unknown) => typeof field === 'string' && /^[a-zA-Z]+$/.test(field)); } catch { /* Error bodies never become displayed copy. */ }
      const rawRetry = response.headers.get('Retry-After') ?? '', seconds = /^[1-9]\d*$/.test(rawRetry) ? Math.min(900, Number(rawRetry)) : 900;
      throw new InquiryFailure(response.status, messages[response.status] ?? 'We could not confirm receipt. Your input has been kept. Retry the unchanged inquiry when the service is available.', fields, response.status === 429 ? seconds : 0);
    }
    try { if (response.status !== 201) throw Error(); return acknowledgment.parse(await response.json()).data; }
    catch { throw new InquiryFailure(0, 'The receipt could not be verified. Your input has been kept. Retry without changing the details to check the same inquiry.'); }
  }
}
