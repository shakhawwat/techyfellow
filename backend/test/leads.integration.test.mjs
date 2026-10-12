// Actual HTTP/replica-set verification, strictly owned synthetic Step 15 database only.
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
const require = createRequire(import.meta.url);
const { authDefinitions } = require('../dist/auth/auth.schemas.js'), { hashPassword } = require('../dist/auth/password.js');
const uri = 'mongodb://mongodb:27017/techyfellow_test_step15?replicaSet=rs0', base = 'http://127.0.0.1:4000/api/v1';
const input = JSON.parse(await new Promise(resolve => { let text = ''; process.stdin.on('data', data => text += data); process.stdin.on('end', () => resolve(text)); }));
const roles = ['SUPER_ADMIN', 'SALES_MANAGER', 'CONTENT_EDITOR', 'RESEARCH_EDITOR', 'ACADEMY_MANAGER', 'VIEWER'];
const common = type => ({ type, name: 'Synthetic Step15 private contact', email: `synthetic-step15-${type}@example.invalid`, consent: true });
const fields = { engineering: { projectType: 'iot', problem: 'Synthetic engineering problem', timeline: 'To discuss', budgetRange: 'To discuss' }, research: { domain: 'Synthetic domain', currentStage: 'Synthetic stage', expectedDeliverable: 'Synthetic deliverable', availableDataHardware: 'Synthetic hardware' }, mentorship: { university: 'Synthetic university', department: 'Synthetic department', area: 'Synthetic area', teamSize: 3, stage: 'Synthetic stage', requestedHelp: 'Synthetic requested help' }, institutional: { institution: 'Synthetic institution', participantCount: 12, topics: 'Synthetic topics', date: '2027-01-20', deliveryMode: 'offline', location: 'Synthetic location' }, training: { topics: 'Synthetic training topics', participantCount: 2, deliveryMode: 'online' }, 'course-interest': { course: 'synthetic-course', experienceLevel: 'Synthetic beginner', contactPreference: 'email' }, contact: { message: 'Synthetic private contact message' } };
test('actual persistence/idempotency, lead-only authorization, revisions and transactional audits', { timeout: 180000 }, async () => {
  assert.equal(process.env.NODE_ENV, 'test'); assert.equal(process.env.MONGODB_URI, uri); assert.match(input.runId, /^[a-f0-9]{32}$/); assert.ok(input.password.length >= 24);
  const resume = process.env.TECHYFELLOW_LEAD_TEST_PHASE === 'permissions';
  const connection = await mongoose.createConnection(uri, { autoIndex: false, autoCreate: false, serverSelectionTimeoutMS: 2000 }).asPromise();
  try {
    if (resume) assert.equal((await connection.db.collection('synthetic_test_ownership').findOne({ _id: 'step15' }))?.runId, input.runId);
    else { assert.equal((await connection.db.listCollections().toArray()).length, 0, 'Refuse any existing database'); await connection.db.collection('synthetic_test_ownership').insertOne({ _id: 'step15', runId: input.runId }); }
    execFileSync(process.execPath, ['dist/content/create-indexes.js'], { stdio: 'pipe' });
    const users = connection.model('User', authDefinitions.user.schema, 'users'), actors = {}, secrets = [input.password];
    const passwordHash = await hashPassword(input.password); secrets.push(passwordHash);
    const noSecrets = value => { const text = JSON.stringify(value); for (const secret of secrets) assert.ok(!text.includes(secret)); for (const field of ['passwordHash', 'tokenHash', 'idempotencyHash', 'payloadHash', 'stack', '__v', 'sessionId']) assert.ok(!text.includes('"' + field + '"')); };
    for (const role of roles) {
      const email = `synthetic-step15-${role.toLowerCase()}@example.invalid`; const user = resume ? await users.findOne({ email }) : await users.create({ email, passwordHash, role, enabled: true }); assert.ok(user);
      const response = await fetch(base + '/auth/login', { method: 'POST', headers: { Origin: 'http://localhost:8080', 'Content-Type': 'application/json', 'X-CSRF-Protection': '1' }, body: JSON.stringify({ email: user.email, password: input.password }) }); assert.equal(response.status, 200);
      const cookie = response.headers.get('set-cookie').split(';')[0]; secrets.push(cookie.split('=')[1]); noSecrets(await response.json()); actors[role] = { id: String(user._id), cookie };
    }
    const leads = connection.db.collection('leads'), audits = connection.db.collection('lead_audits'), throttles = connection.db.collection('lead_throttles');
    const resetThrottle = () => throttles.deleteMany({});
    async function req(path, status, { role, method = 'GET', body, key, headers = {}, rawBody } = {}) {
      const response = await fetch(base + path, { method, headers: { ...(body !== undefined || rawBody !== undefined ? { Origin: 'http://localhost:8080', 'Content-Type': 'application/json', 'X-CSRF-Protection': '1' } : {}), ...(role ? { Cookie: actors[role].cookie } : {}), ...(key ? { 'Idempotency-Key': key } : {}), ...headers }, ...(body !== undefined || rawBody !== undefined ? { body: rawBody ?? JSON.stringify(body) } : {}) });
      assert.equal(response.status, status, `${method} ${path}`); const value = await response.json(); noSecrets(value); assert.equal(response.headers.get('cache-control'), 'no-store'); if (status >= 400) assert.ok(value.error?.code); return value;
    }
    const submitted = {};
    if (!resume) {
    for (const [type, detail] of Object.entries(fields)) {
      const body = { ...common(type), ...detail }, key = randomBytes(24).toString('hex'); const value = await req('/leads', 201, { method: 'POST', body, key });
      assert.deepEqual(Object.keys(value), ['data']); assert.deepEqual(Object.keys(value.data).sort(), ['reference', 'status']); assert.match(value.data.reference, /^TF-[A-F0-9]{24}$/); assert.equal(value.data.status, 'received');
      const saved = await leads.findOne({ reference: value.data.reference }); assert.equal(saved.email, body.email); assert.equal(saved.status, 'received'); assert.equal(saved.revision, 1); assert.equal(saved.marketingConsent, false); assert.deepEqual(saved.payload, detail); submitted[type] = saved;
    }
    console.log('PASS: all seven minimally required typed inquiries persisted; acknowledgment/reference contain no private/internal fields');
    await resetThrottle();
    for (const change of [{ status: 'won' }, { ownerId: actors.SALES_MANAGER.id }, { notes: ['Synthetic leak'] }, { revision: 88 }, { payload: {} }, { createdAt: '2026-01-01' }, { consent: false }, { marketingConsent: 'true' }, { website: 'bot' }, { email: 'invalid' }, { message: 'x'.repeat(4001) }, { phone: '<script>' }, { unexpected: 'Synthetic secret' }]) {
      const before = await leads.countDocuments(); const result = await req('/leads', 400, { method: 'POST', body: { ...common('contact'), ...fields.contact, ...change }, key: randomBytes(24).toString('hex') }); assert.equal(await leads.countDocuments(), before); assert.ok(!JSON.stringify(result).includes('Synthetic secret'));
    }
    await req('/leads', 400, { method: 'POST', body: { ...common('contact'), ...fields.contact } });
    await req('/leads', 400, { method: 'POST', rawBody: '{"email":"Synthetic parser private",', key: randomBytes(24).toString('hex') });
    await req('/leads', 413, { method: 'POST', rawBody: '{"message":"' + 'x'.repeat(17000) + '"}', key: randomBytes(24).toString('hex') });
    await req('/leads', 413, { method: 'POST', rawBody: ' '.repeat(17000) + '{}', key: randomBytes(24).toString('hex') });
    await req('/leads', 403, { method: 'POST', body: { ...common('contact'), ...fields.contact }, key: randomBytes(24).toString('hex'), headers: { Origin: 'https://unconfigured.example.invalid' } });
    await req('/leads', 403, { method: 'POST', body: { ...common('contact'), ...fields.contact }, key: randomBytes(24).toString('hex'), headers: { 'X-CSRF-Protection': '0' } });
    console.log('PASS: protected/unknown/invalid fields, honeypot, wire/text limits and CSRF/origin handling rejected without persistence');
    await resetThrottle();
    const retryBody = { ...common('contact'), email: 'synthetic-step15-retry@example.invalid', ...fields.contact, marketingConsent: true }, retryKey = randomBytes(24).toString('hex'), count = await leads.countDocuments();
    const values = await Promise.all([1, 2, 3].map(() => req('/leads', 201, { method: 'POST', body: retryBody, key: retryKey }))); assert.deepEqual(values[0], values[1]); assert.deepEqual(values[0], values[2]); assert.equal(await leads.countDocuments(), count + 1);
    assert.deepEqual(await req('/leads', 201, { method: 'POST', body: { ...retryBody, name: '  ' + retryBody.name + '  ' }, key: retryKey }), values[0]);
    await req('/leads', 409, { method: 'POST', body: { ...retryBody, message: 'Synthetic changed retry' }, key: retryKey }); assert.equal(await leads.countDocuments(), count + 1);
    assert.equal((await leads.findOne({ reference: values[0].data.reference })).marketingConsent, true);
    console.log('PASS: concurrent/retried idempotent submissions create one record; changed payload returns 409; marketing consent is separate');
    } else { for (const type of Object.keys(fields)) submitted[type] = await leads.findOne({ type, email: common(type).email }); }
    const target = submitted.engineering, path = '/admin/leads/' + target._id;
    for (const role of ['CONTENT_EDITOR', 'RESEARCH_EDITOR', 'ACADEMY_MANAGER', 'VIEWER']) {
      for (const url of ['/admin/leads', '/admin/leads/owners', path]) await req(url, 403, { role }); await req(path, 403, { role, method: 'PATCH', body: { revision: 1, note: 'Synthetic forbidden note' } });
    }
    for (const url of ['/admin/leads', '/admin/leads/owners', path]) await req(url, 401); await req(path, 401, { method: 'PATCH', body: { revision: 1, note: 'Synthetic anonymous note' } });
    for (const resource of ['projects', 'research', 'publications', 'team', 'courses']) await req('/admin/' + resource, 403, { role: 'SALES_MANAGER' });
    await req('/admin/media?resource=projects', 403, { role: 'SALES_MANAGER' });
    for (const query of ['page=0', 'limit=101', 'sort=email', 'status=published', 'type=invalid', 'email=private', 'ownerId=bad', 'type=contact&type=research', 'status[$ne]=closed']) await req('/admin/leads?' + query, 400, { role: 'SUPER_ADMIN' });
    const owners = await req('/admin/leads/owners', 200, { role: 'SALES_MANAGER' }); assert.equal(owners.data.length, 2); assert.ok(owners.data.every(user => ['SUPER_ADMIN', 'SALES_MANAGER'].includes(user.role)));
    await req('/admin/leads/bad', 400, { role: 'SALES_MANAGER' }); await req('/admin/leads/' + new mongoose.Types.ObjectId(), 404, { role: 'SUPER_ADMIN' });
    const publicGet = await fetch(base + '/leads'); assert.equal(publicGet.status, 404);
    console.log('PASS: anonymous/forbidden roles denied; SALES_MANAGER has no content/media access; IDs, query allowlists and restricted owner listing validated');
    let current = target; let revision = 1;
    async function update(body, role = 'SALES_MANAGER') { const result = (await req(path, 200, { role, method: 'PATCH', body: { revision, ...body } })).data; revision++; assert.equal(result.revision, revision); const rows = await audits.find({ leadId: target._id, revision }).toArray(); assert.equal(rows.length, 1); assert.equal(String(rows[0].actor), actors[role].id); assert.equal(rows[0].action, 'update'); assert.ok(rows[0].createdAt instanceof Date); assert.deepEqual(Object.keys(rows[0]).sort(), ['__v', '_id', 'action', 'actor', 'createdAt', 'fields', 'leadId', 'resource', 'revision'].sort()); current = result; return result; }
    await req(path, 400, { role: 'SALES_MANAGER', method: 'PATCH', body: { revision, ownerId: actors.CONTENT_EDITOR.id } });
    await users.updateOne({ _id: actors.SUPER_ADMIN.id }, { $set: { enabled: false } }); await req(path, 400, { role: 'SALES_MANAGER', method: 'PATCH', body: { revision, ownerId: actors.SUPER_ADMIN.id } }); await users.updateOne({ _id: actors.SUPER_ADMIN.id }, { $set: { enabled: true } });
    await req(path, 400, { role: 'SALES_MANAGER', method: 'PATCH', body: { revision, email: 'synthetic-overwrite@example.invalid' } });
    await req(path, 409, { role: 'SALES_MANAGER', method: 'PATCH', body: { revision, status: 'won' } });
    await update({ status: 'triaged', ownerId: actors.SALES_MANAGER.id, note: 'Synthetic internal note <script>window.syntheticLeadUnsafe=true</script>' }); assert.equal(current.notes.length, 1); assert.equal(current.ownerId, actors.SALES_MANAGER.id);
    await req(path, 409, { role: 'SUPER_ADMIN', method: 'PATCH', body: { revision: 1, note: 'Synthetic stale note' } });
    const before = await leads.findOne({ _id: target._id }), auditCount = await audits.countDocuments();
    await connection.db.command({ collMod: 'lead_audits', validator: { action: { $eq: 'synthetic-impossible-audit' } }, validationLevel: 'strict', validationAction: 'error' });
    await req(path, 503, { role: 'SALES_MANAGER', method: 'PATCH', body: { revision, note: 'Synthetic must roll back', status: 'contacted' } });
    assert.deepEqual(await leads.findOne({ _id: target._id }), before); assert.equal(await audits.countDocuments(), auditCount);
    await connection.db.command({ collMod: 'lead_audits', validator: {}, validationLevel: 'strict' });
    await update({ status: 'contacted', ownerId: null }, 'SUPER_ADMIN'); await update({ status: 'qualified' }); await update({ status: 'proposal' }); await update({ status: 'won' });
    await req(path, 409, { role: 'SALES_MANAGER', method: 'PATCH', body: { revision, status: 'triaged' } });
    const noteBefore = await audits.countDocuments(); await req(path, 409, { role: 'SALES_MANAGER', method: 'PATCH', body: { revision: 1, note: 'Synthetic stale note' } }); assert.equal(await audits.countDocuments(), noteBefore);
    assert.equal((await req('/admin/leads?status=won&type=engineering&limit=1', 200, { role: 'SUPER_ADMIN' })).pagination.total, 1);
    const paginated = await req('/admin/leads?page=2&limit=2', 200, { role: 'SALES_MANAGER' }); assert.equal(paginated.data.length, 2); assert.ok(paginated.data.every(row => row.notes === undefined && row.payload === undefined));
    console.log('PASS: authorized owner/note/status workflow; atomic actor/revision audits, forced actual audit-insert failure rolls back both; stale updates return 409');
    await resetThrottle();
    for (let n = 0; n < 30; n++) await req('/leads', 400, { method: 'POST', body: { ...common('contact'), ...fields.contact }, key: 'bad', headers: { 'X-Forwarded-For': `198.51.100.${n + 1}` } });
    await req('/leads', 429, { method: 'POST', body: { ...common('contact'), ...fields.contact }, key: 'bad', headers: { 'X-Forwarded-For': '203.0.113.1' } });
    for (const row of await throttles.find().toArray()) assert.match(row.key, /^[a-f0-9]{64}$/);
    await resetThrottle();
    for (let n = 0; n < 5; n++) await req('/leads', 201, { method: 'POST', body: { ...common('contact'), email: 'synthetic-rate@example.invalid', ...fields.contact }, key: randomBytes(24).toString('hex') });
    await req('/leads', 429, { method: 'POST', body: { ...common('contact'), email: 'synthetic-rate@example.invalid', ...fields.contact }, key: randomBytes(24).toString('hex') });
    await resetThrottle();
    console.log('PASS: actual IP/email rate limits; spoofed forwarded headers cannot bypass trust-none counters; no raw contact/IP values in throttle records');
    const disabled = actors.SALES_MANAGER; await users.updateOne({ _id: disabled.id }, { $set: { enabled: false } }); await req('/admin/leads', 401, { role: 'SALES_MANAGER' }); await users.updateOne({ _id: disabled.id }, { $set: { enabled: true } });
    const env = { ...process.env, SALES_MANAGER_EMAIL: 'synthetic-step15-command@example.invalid', SALES_MANAGER_PASSWORD: input.password };
    const stdout = execFileSync(process.execPath, ['dist/auth/create-sales-manager.js'], { env, encoding: 'utf8' }); assert.ok(!stdout.includes(input.password)); const commandUser = await users.findOne({ email: env.SALES_MANAGER_EMAIL }); assert.equal(commandUser.role, 'SALES_MANAGER');
    assert.throws(() => execFileSync(process.execPath, ['dist/auth/create-sales-manager.js'], { env: { ...env, SALES_MANAGER_EMAIL: ' SYNTHETIC-STEP15-SUPER_ADMIN@EXAMPLE.INVALID ' }, stdio: 'pipe' })); assert.equal((await users.findById(actors.SUPER_ADMIN.id)).role, 'SUPER_ADMIN');
    // Extra clearly synthetic rows support actual browser pagination, never public company content.
    for (let n = 1; n <= 10; n++) await leads.insertOne({ ...submitted.contact, _id: new mongoose.Types.ObjectId(), reference: `TF-${randomBytes(12).toString('hex').toUpperCase()}`, name: 'Synthetic pagination contact ' + n, idempotencyHash: randomBytes(32).toString('hex'), payloadHash: randomBytes(32).toString('hex'), createdAt: new Date(), updatedAt: new Date() });
    console.log('PASS: disabled manager loses access immediately; explicit environment-only command creates SALES_MANAGER and refuses existing-account elevation');
  } finally { await connection.close(); }
});
