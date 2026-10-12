// Final-image parser/privacy/concurrency checks; guarded synthetic Step 15 data only.
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { randomBytes } from 'node:crypto';
const uri = 'mongodb://mongodb:27017/techyfellow_test_step15?replicaSet=rs0', base = 'http://127.0.0.1:4000/api/v1', origin = 'http://localhost:8080';
assert.equal(process.env.NODE_ENV, 'test'); assert.equal(process.env.MONGODB_URI, uri);
const input = JSON.parse(await new Promise(resolve => { let text = ''; process.stdin.on('data', value => text += value); process.stdin.on('end', () => resolve(text)); }));
const connection = await mongoose.createConnection(uri).asPromise();
try {
  assert.equal((await connection.db.collection('synthetic_test_ownership').findOne({ _id: 'step15' }))?.runId, input.runId);
  const headers = { Origin: origin, 'Content-Type': 'application/json', 'X-CSRF-Protection': '1' };
  for (const path of ['/leads', '/LEADS', '/LeAdS/']) { const response = await fetch(base + path, { method: 'POST', headers, body: ' '.repeat(17000) + '{}' }); assert.equal(response.status, 413); assert.ok(!JSON.stringify(await response.json()).includes('stack')); }
  const preflight = await fetch(base + '/leads', { method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'Content-Type,X-CSRF-Protection,Idempotency-Key' } }); assert.equal(preflight.headers.get('access-control-allow-origin'), origin); assert.ok(preflight.headers.get('access-control-allow-headers').toLowerCase().includes('idempotency-key'));
  const denied = await fetch(base + '/leads', { method: 'OPTIONS', headers: { Origin: 'https://forbidden.example.invalid', 'Access-Control-Request-Method': 'POST' } }); assert.equal(denied.headers.get('access-control-allow-origin'), null);
  assert.equal((await fetch(base + '/health/live')).status, 200); assert.equal((await fetch(base + '/health/ready')).status, 200);
  const login = await fetch(base + '/auth/login', { method: 'POST', headers, body: JSON.stringify({ email: 'synthetic-step15-sales_manager@example.invalid', password: input.password }) }); assert.equal(login.status, 200); const cookie = login.headers.get('set-cookie').split(';')[0];
  const key = randomBytes(24).toString('hex'), body = { type: 'contact', name: 'Synthetic final private contact', email: 'synthetic-final-private@example.invalid', message: 'Synthetic final sensitive message', consent: true };
  const before = await connection.db.collection('leads').countDocuments();
  const create = await fetch(base + '/leads', { method: 'POST', headers: { ...headers, 'Idempotency-Key': key }, body: JSON.stringify(body) }); assert.equal(create.status, 201); const acknowledgment = await create.json();
  const lead = await connection.db.collection('leads').findOne({ reference: acknowledgment.data.reference });
  const responses = await Promise.all(['Synthetic final internal note one', 'Synthetic final internal note two'].map(note => fetch(base + '/admin/leads/' + lead._id, { method: 'PATCH', headers: { ...headers, Cookie: cookie }, body: JSON.stringify({ revision: 1, status: 'closed', note }) })));
  assert.deepEqual(responses.map(response => response.status).sort(), [200, 409]);
  const saved = await connection.db.collection('leads').findOne({ _id: lead._id }); assert.equal(saved.revision, 2); assert.equal(saved.notes.length, 1); assert.equal(saved.status, 'closed'); assert.equal(await connection.db.collection('lead_audits').countDocuments({ leadId: lead._id }), 1);
  const retry = await fetch(base + '/leads', { method: 'POST', headers: { ...headers, 'Idempotency-Key': key }, body: JSON.stringify(body) }); assert.equal(retry.status, 201); assert.deepEqual(await retry.json(), acknowledgment); assert.equal(await connection.db.collection('leads').countDocuments(), before + 1);
  assert.deepEqual(Object.keys(acknowledgment.data).sort(), ['reference', 'status']); assert.equal(acknowledgment.data.status, 'received');
  await fetch(base + '/auth/logout', { method: 'POST', headers: { ...headers, Cookie: cookie }, body: '{}' });
  console.log('PASS: final-image wire limits include route case/trailing slash; configured CORS/health; concurrent admin revision writes yield 200/409 and one audit; retried public acknowledgment excludes internal closed status/notes/contact data');
} finally { await connection.close(); }
