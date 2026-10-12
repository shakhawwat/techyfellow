import { z } from 'zod';
export const inquiryTypes = ['engineering', 'research', 'mentorship', 'institutional', 'training', 'course-interest', 'contact'] as const;
export type InquiryType = typeof inquiryTypes[number];
export const inquirySources = ['website', 'solutions', 'research', 'academy', 'institutional', 'contact'] as const;
export type InquirySource = typeof inquirySources[number];
export const typeLabels: Record<InquiryType, string> = { engineering: 'Engineering project', research: 'Research inquiry', mentorship: 'Technical mentorship', institutional: 'Institutional inquiry', training: 'Workshop or training', 'course-interest': 'Course interest', contact: 'General contact' };
export const detailFields = {
  engineering: ['projectType', 'problem', 'budgetRange', 'timeline', 'description'],
  research: ['domain', 'currentStage', 'expectedDeliverable', 'availableDataHardware'],
  mentorship: ['university', 'department', 'area', 'teamSize', 'stage', 'requestedHelp'],
  institutional: ['institution', 'participantCount', 'topics', 'date', 'deliveryMode', 'location'],
  training: ['institution', 'participantCount', 'topics', 'date', 'deliveryMode', 'location'],
  'course-interest': ['course', 'cohort', 'experienceLevel', 'contactPreference'], contact: ['message'],
} as const;
export type DetailField = typeof detailFields[InquiryType][number];
export const requiredDetail: Record<InquiryType, DetailField> = { engineering: 'problem', research: 'domain', mentorship: 'requestedHelp', institutional: 'institution', training: 'topics', 'course-interest': 'course', contact: 'message' };
export type FieldDefinition = { label: string; kind?: 'textarea' | 'number' | 'date' | 'select'; max: number; hint?: string; choices?: readonly { value: string; label: string }[] };
export const fieldDefinitions: Record<DetailField, FieldDefinition> = {
  projectType: { label: 'Project type', max: 200 }, problem: { label: 'Problem to address', kind: 'textarea', max: 4000 },
  budgetRange: { label: 'Budget context', max: 200, hint: 'Optional; a range or “to discuss” is enough.' }, timeline: { label: 'Timeline', max: 200 }, description: { label: 'Additional project context', kind: 'textarea', max: 4000 },
  domain: { label: 'Research domain', max: 200 }, currentStage: { label: 'Current research stage', max: 200 }, expectedDeliverable: { label: 'Expected deliverable', kind: 'textarea', max: 4000 }, availableDataHardware: { label: 'Available data or hardware', kind: 'textarea', max: 4000 },
  university: { label: 'University', max: 200 }, department: { label: 'Department', max: 200 }, area: { label: 'Technical area', max: 200 }, teamSize: { label: 'Team size', kind: 'number', max: 10000 }, stage: { label: 'Current project stage', max: 200 }, requestedHelp: { label: 'Help requested', kind: 'textarea', max: 4000 },
  institution: { label: 'Institution', max: 200 }, participantCount: { label: 'Participant count', kind: 'number', max: 10000 }, topics: { label: 'Topics to explore', kind: 'textarea', max: 2000 }, date: { label: 'Requested date', kind: 'date', max: 200, hint: 'A preference only; this does not reserve a date.' },
  deliveryMode: { label: 'Preferred delivery mode', kind: 'select', max: 200, choices: [{ value: 'online', label: 'Online' }, { value: 'offline', label: 'In person' }, { value: 'hybrid', label: 'Hybrid' }, { value: 'to-discuss', label: 'To discuss' }] }, location: { label: 'Location context', max: 200 },
  course: { label: 'Course of interest', kind: 'select', max: 200 }, cohort: { label: 'Cohort context', max: 200, hint: 'Optional context only; no scheduled cohort is confirmed here.' }, experienceLevel: { label: 'Experience level', max: 200 }, contactPreference: { label: 'Contact preference', kind: 'select', max: 200, choices: [{ value: 'email', label: 'Email' }, { value: 'phone', label: 'Phone' }] }, message: { label: 'Your message', kind: 'textarea', max: 4000 },
};
function text(max: number, required = false) {
  // Match backend UTF-16 length and prohibited controls before trimming, including astral characters.
  return z.string().refine(value => value.length <= max, `Use at most ${max} characters.`).refine(value => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value), 'Remove unsupported control characters.').transform(value => value.trim()).refine(value => !required || !!value, 'This field is required.');
}
const shape = z.strictObject({
  type: z.enum(inquiryTypes), name: text(120, true), email: text(254, true).transform(value => value.toLowerCase()).refine(value => /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(value), 'Enter a valid email address.'),
  phone: text(40).refine(value => !value || /^[+\d][\d ().-]{5,39}$/.test(value), 'Use a phone number with digits and conventional punctuation.').optional(), organization: text(200).optional(),
  consent: z.boolean().refine(value => value === true, 'Acknowledge inquiry handling before submitting.'), marketingConsent: z.boolean().optional(), source: z.enum(inquirySources), website: text(200).optional(),
  projectType: text(200).optional(), problem: text(4000).optional(), budgetRange: text(200).optional(), timeline: text(200).optional(), description: text(4000).optional(),
  domain: text(200).optional(), currentStage: text(200).optional(), expectedDeliverable: text(4000).optional(), availableDataHardware: text(4000).optional(),
  university: text(200).optional(), department: text(200).optional(), area: text(200).optional(), teamSize: z.number().int().min(1).max(10000).optional(), stage: text(200).optional(), requestedHelp: text(4000).optional(),
  institution: text(200).optional(), participantCount: z.number().int().min(1).max(10000).optional(), topics: text(2000).optional(), date: text(200).optional(), deliveryMode: text(200).optional(), location: text(200).optional(),
  course: text(200).optional(), cohort: text(200).optional(), experienceLevel: text(200).optional(), contactPreference: text(200).optional(), message: text(4000).optional(),
});
export type InquiryValues = z.input<typeof shape>;
export type FieldName = keyof InquiryValues;
export type InquiryPayload = { type: InquiryType; name: string; email: string; consent: true; marketingConsent: boolean; source: InquirySource; website: string; phone?: string; organization?: string } & Partial<Record<DetailField, string | number>>;
export function normalizeInquiry(values: InquiryValues): InquiryPayload {
  const payload: InquiryPayload = { type: values.type, name: values.name.trim(), email: values.email.trim().toLowerCase(), consent: true, marketingConsent: values.marketingConsent === true, source: values.source, website: values.website?.trim() ?? '' };
  if (values.phone?.trim()) payload.phone = values.phone.trim(); if (values.organization?.trim()) payload.organization = values.organization.trim();
  for (const field of detailFields[values.type]) { const value = values[field]; if (typeof value === 'number') payload[field] = value; else if (value?.trim()) payload[field] = value.trim(); }
  return payload;
}
export const inquirySchema = shape.superRefine((values, context) => {
  const issue = (field: FieldName | undefined, message: string) => context.addIssue({ code: 'custom', path: field ? [field] : [], message });
  if (!values[requiredDetail[values.type]]) issue(requiredDetail[values.type], 'This field is required.');
  for (const field of Object.keys(fieldDefinitions) as DetailField[]) if (!(detailFields[values.type] as readonly string[]).includes(field) && values[field] !== undefined && values[field] !== '') issue(field, 'This field belongs to another inquiry type.');
  if (values.website) issue(undefined, 'The inquiry could not be accepted. Review the visible fields and try again.');
  if (values.date && (!/^\d{4}-\d{2}-\d{2}$/.test(values.date) || !Number.isFinite(Date.parse(values.date)) || new Date(values.date).toISOString().slice(0, 10) !== values.date)) issue('date', 'Enter a valid calendar date.');
  if (values.deliveryMode && !['online', 'offline', 'hybrid', 'to-discuss'].includes(values.deliveryMode)) issue('deliveryMode', 'Choose a supported delivery preference.');
  if (values.contactPreference && !['email', 'phone'].includes(values.contactPreference)) issue('contactPreference', 'Choose email or phone.');
  if (values.contactPreference === 'phone' && !values.phone) issue('phone', 'Provide a phone number for this preference.');
  if (values.course && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.course)) issue('course', 'Choose a published course.');
  if (new TextEncoder().encode(JSON.stringify(normalizeInquiry(values))).length > 16384) issue(undefined, 'The inquiry is too long. Shorten the optional context before submitting.');
});
export type InquirySearch = Record<string, string | string[] | undefined>;
export function inquiryPrefill(search: InquirySearch, engineering = false): InquiryType { const type = search.type; return engineering ? 'engineering' : typeof type === 'string' && inquiryTypes.includes(type as InquiryType) ? type as InquiryType : 'contact'; }
// URLs contain only allowlisted type selection, never entered field values or a receipt.
export function inquiryHref(type: InquiryType): string { return type === 'engineering' ? '/build-with-us' : `/contact?type=${type}`; }
export function inquiryDefaults(type: InquiryType, source: InquirySource, course?: string): InquiryValues { return { type, source, name: '', email: '', phone: '', organization: '', consent: false, marketingConsent: false, website: '', ...(type === 'course-interest' && course && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(course) && course.length <= 200 ? { course } : {}) }; }
export type CourseChoices = { state: 'available' | 'unavailable'; data: { slug: string; title: string }[]; hasMore?: boolean };
