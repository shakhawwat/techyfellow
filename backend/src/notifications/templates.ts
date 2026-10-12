import type { LeadRecord } from "../leads/lead.schema";
import type { EmailConfiguration } from "./email.config";
import type { EmailMessage, NotificationKind } from "./notification.schema";
export function escapeHtml(value: string): string { return value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!); }
export function notificationTemplate(kind: NotificationKind, lead: Pick<LeadRecord, "name" | "email" | "reference" | "type"> & { _id: unknown }, config: EmailConfiguration): EmailMessage {
  if (kind === "acknowledgment") { const text = `Hello ${lead.name},\n\nYour inquiry has been received and saved. Reference: ${lead.reference}.\nThis acknowledges receipt only. It does not confirm a booking, enrollment, availability or a response time.\n\nTechy Fellow`;
    return { from: config.from, to: [lead.email], subject: `Inquiry received — ${lead.reference}`, text, html: `<p>Hello ${escapeHtml(lead.name)},</p><p>Your inquiry has been received and saved. Reference: <strong>${escapeHtml(lead.reference)}</strong>.</p><p>This acknowledges receipt only. It does not confirm a booking, enrollment, availability or a response time.</p><p>Techy Fellow</p>` }; }
  const adminLink = `${config.adminBaseUrl}/leads/${String(lead._id)}`;
  return { from: config.from, to: config.recipients, subject: `New inquiry — ${lead.reference}`, text: `A ${lead.type} inquiry was saved. Reference: ${lead.reference}.\nReview in the protected admin: ${adminLink}\nContact details and inquiry text are available only in admin.`, html: `<p>A ${escapeHtml(lead.type)} inquiry was saved.</p><p>Reference: <strong>${escapeHtml(lead.reference)}</strong>.</p><p><a href="${escapeHtml(adminLink)}">Review in the protected admin</a></p><p>Contact details and inquiry text are available only in admin.</p>` };
}
