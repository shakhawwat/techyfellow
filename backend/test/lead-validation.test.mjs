import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { parseInquiry, parseLeadUpdate, parseLeadQuery } = require('../dist/leads/lead-input.js');
const { hasPermission, grantedPermissions } = require('../dist/auth/permissions.js');
const base = { type: 'contact', name: 'Synthetic person', email: 'Synthetic@Example.Invalid', message: 'Synthetic message', consent: true };
test('typed minimal inquiry validation, independent consent and unknown/internal field rejection', () => {
  const value = parseInquiry(base); assert.equal(value.email, 'synthetic@example.invalid'); assert.equal(value.marketingConsent, false); assert.equal(value.payload.message, base.message);
  for (const changes of [{ consent: false }, { marketingConsent: 'true' }, { email: 'invalid' }, { status: 'won' }, { ownerId: null }, { notes: [] }, { payload: {} }, { revision: 99 }, { website: 'bot' }, { message: 'x'.repeat(4001) }, { source: 'https://private.invalid?email=secret' }, { type: 'training', topics: undefined }, { type: 'engineering', projectType: 'iot', problem: undefined }]) assert.throws(() => parseInquiry({ ...base, ...changes }), error => error.getStatus() === 400);
  assert.throws(() => parseInquiry({ ...base, message: 'x'.repeat(20000) }), error => error.getStatus() === 413);
});
test('admin ID/revision/fields and query allowlists; contact permissions stay isolated', () => {
  assert.equal(parseLeadUpdate({ revision: 1, note: 'Synthetic note' }).note, 'Synthetic note');
  for (const body of [{ revision: 0, note: 'x' }, { revision: 1, notes: [] }, { revision: 1, status: 'published' }, { revision: 1, ownerId: 'bad' }, { revision: 1 }, { revision: 1, note: '' }]) assert.throws(() => parseLeadUpdate(body));
  for (const query of [{ page: '0' }, { limit: '101' }, { type: { $ne: 'contact' } }, { status: ['received'] }, { sort: 'email' }, { email: 'synthetic@example.invalid' }, { ownerId: 'bad' }]) assert.throws(() => parseLeadQuery(query));
  const query = parseLeadQuery({ page: '2', limit: '20', type: 'contact', status: 'received', ownerId: 'unassigned' }); assert.equal(query.skip, 20); assert.deepEqual(query.filter, { type: { $eq: 'contact' }, status: { $eq: 'received' }, ownerId: null });
  assert.deepEqual(grantedPermissions('SALES_MANAGER'), ['admin:access', 'leads:read', 'leads:manage']);
  for (const role of ['CONTENT_EDITOR', 'RESEARCH_EDITOR', 'ACADEMY_MANAGER', 'VIEWER', '__proto__']) assert.equal(hasPermission(role, 'leads:read'), false);
  for (const resource of ['projects', 'research', 'publications', 'team', 'courses']) for (const action of ['read', 'edit', 'publish']) assert.equal(hasPermission('SALES_MANAGER', `${resource}:${action}`), false);
});
