// Synthetic users and randomly generated fixture credentials only. Never run against production.
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createRequire } from 'node:module';
import { randomBytes, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
const exec = promisify(execFile);
const require = createRequire(import.meta.url);
const { authDefinitions } = require('../dist/auth/auth.schemas.js');
const { contentDefinitions } = require('../dist/content/content.schemas.js');
const { hashPassword } = require('../dist/auth/password.js');
const uri = 'mongodb://mongodb:27017/techyfellow_test_step7?replicaSet=rs0';
const base = 'http://127.0.0.1:4000/api/v1';
const origin = 'http://localhost:8080';
const password = randomBytes(24).toString('base64url');
const hashToken = value => createHash('sha256').update(value).digest('hex');
const secrets = [password];
function assertNoSecrets(value) {
  const json = JSON.stringify(value);
  for (const secret of secrets) assert.ok(!json.includes(secret), 'Secret leaked');
  if (Array.isArray(value)) return value.forEach(assertNoSecrets);
  if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) {
    assert.ok(!['password', 'passwordHash', 'token', 'tokenHash', 'sessionId', 'session', 'stack'].includes(key), `Internal field: ${key}`);
    assertNoSecrets(child);
  }
}
async function request(path, status, { method = 'GET', cookie, body, headers = {} } = {}) {
  const r = await fetch(base + path, { method, headers: { ...(body !== undefined ? { 'Content-Type': 'application/json', Origin: origin, 'X-CSRF-Protection': '1' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers }, ...(body !== undefined ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}) });
  assert.equal(r.status, status, `${method} ${path}`);
  const data = await r.json();
  assertNoSecrets(data);
  if (data.data?.user) assert.deepEqual(Object.keys(data.data.user).sort(), ['email', 'id', 'role']);
  if (path.startsWith('/auth') || path.startsWith('/admin')) assert.equal(r.headers.get('cache-control'), 'no-store');
  if (status >= 400) assert.deepEqual(Object.keys(data), ['error']);
  return { r, data };
}
async function login(email, cookie) {
  const result = await request('/auth/login', 200, { method: 'POST', body: { email, password }, cookie });
  const header = result.r.headers.get('set-cookie');
  assert.ok(header.includes('HttpOnly') && header.includes('SameSite=Lax') && header.includes('Path=/'));
  assert.ok(!header.includes('Secure'), 'Local test uses non-secure development cookie');
  const nextCookie = header.split(';')[0];
  const token = nextCookie.slice(nextCookie.indexOf('=') + 1);
  assert.ok(/^[A-Za-z0-9_-]{43}$/.test(token)); secrets.push(token);
  assert.equal(result.r.headers.get('access-control-allow-origin'), origin);
  assert.equal(result.r.headers.get('access-control-allow-credentials'), 'true');
  return { ...result, cookie: nextCookie, token };
}

test('isolated synthetic authentication, permissions and session verification', { timeout: 120000 }, async () => {
  assert.equal(process.env.NODE_ENV, 'test');
  assert.equal(process.env.MONGODB_URI, uri, 'Requires exact isolated test URI');
  const connection = mongoose.createConnection(uri, { autoCreate: false, autoIndex: false, serverSelectionTimeoutMS: 2000 });
  connection.on('error', () => undefined);
  await connection.asPromise();
  let owned = false;
  try {
    assert.equal(connection.name, 'techyfellow_test_step7');
    assert.equal((await connection.db.listCollections().toArray()).length, 0, 'Refuse nonempty test database');
    owned = true;
    await exec(process.execPath, ['dist/content/create-indexes.js'], { timeout: 30000 });
    const users = connection.model('User', authDefinitions.user.schema, authDefinitions.user.collection);
    const sessions = connection.model('AuthSession', authDefinitions.session.schema, authDefinitions.session.collection);
    const audits = connection.model('AuthAudit', authDefinitions.audit.schema, authDefinitions.audit.collection);
    const passwordHash = await hashPassword(password); secrets.push(passwordHash);
    assert.ok(passwordHash.startsWith('$argon2id$v=19$'));
    assert.deepEqual(passwordHash.split('$')[3].split(',').sort(), ['m=65536', 'p=1', 't=3']);
    const userByRole = {};
    for (const role of ['SUPER_ADMIN', 'CONTENT_EDITOR', 'RESEARCH_EDITOR', 'ACADEMY_MANAGER', 'VIEWER']) {
      userByRole[role] = await users.create({ email: `synthetic-${role.toLowerCase()}@example.invalid`, passwordHash, role, enabled: true });
    }
    const normalized = userByRole.CONTENT_EDITOR.email;
    await assert.rejects(users.create({ email: `  ${normalized.toUpperCase()}  `, passwordHash, role: 'SUPER_ADMIN' }), e => e.code === 11000);
    assert.ok((await users.collection.indexes()).some(i => i.name === 'email_unique' && i.unique));
    assert.ok((await sessions.collection.indexes()).some(i => i.name === 'session_token_unique' && i.unique));
    assert.ok((await sessions.collection.indexes()).some(i => i.name === 'session_expiry' && i.expireAfterSeconds === 0));
    console.log('PASS: Argon2id, explicit auth indexes and duplicate normalized email rejection');

    const bootstrapEnv = { ...process.env, BOOTSTRAP_ADMIN_EMAIL: `synthetic-bootstrap@example.invalid`, BOOTSTRAP_ADMIN_PASSWORD: password };
    await exec(process.execPath, ['dist/auth/bootstrap-admin.js'], { env: bootstrapEnv, timeout: 30000 });
    assert.equal((await users.findOne({ email: bootstrapEnv.BOOTSTRAP_ADMIN_EMAIL })).role, 'SUPER_ADMIN');
    await assert.rejects(exec(process.execPath, ['dist/auth/bootstrap-admin.js'], { env: bootstrapEnv, timeout: 30000 }));
    await assert.rejects(exec(process.execPath, ['dist/auth/bootstrap-admin.js'], { env: { ...bootstrapEnv, BOOTSTRAP_ADMIN_EMAIL: normalized.toUpperCase() }, timeout: 30000 }));
    assert.equal((await users.findById(userByRole.CONTENT_EDITOR._id)).role, 'CONTENT_EDITOR');
    await assert.rejects(exec(process.execPath, ['dist/auth/bootstrap-admin.js'], { env: { ...bootstrapEnv, BOOTSTRAP_ADMIN_PASSWORD: '' }, timeout: 30000 }));
    console.log('PASS: bootstrap command creates once and refuses overwrite/elevation/missing credentials');

    await request('/admin/access', 401); await request('/auth/me', 401);
    await request('/auth/logout', 401, { method: 'POST', body: {} });
    const wrong = await request('/auth/login', 401, { method: 'POST', body: { email: userByRole.SUPER_ADMIN.email, password: randomBytes(24).toString('hex') } });
    const unknown = await request('/auth/login', 401, { method: 'POST', body: { email: 'synthetic-missing@example.invalid', password } });
    assert.deepEqual(wrong.data, unknown.data);
    const first = await login(` ${userByRole.SUPER_ADMIN.email.toUpperCase()} `);
    assert.equal(first.data.data.user.email, userByRole.SUPER_ADMIN.email);
    let persisted = await sessions.findOne({ tokenHash: hashToken(first.token) }).select('+tokenHash').lean();
    assert.equal(persisted.tokenHash, hashToken(first.token));
    assert.ok(!JSON.stringify(persisted).includes(first.token));
    assert.ok(persisted.expiresAt.getTime() - Date.now() <= 28800 * 1000 && persisted.expiresAt > new Date());
    const rotated = await login(userByRole.SUPER_ADMIN.email, first.cookie);
    assert.notEqual(rotated.token, first.token);
    await request('/auth/me', 401, { cookie: first.cookie });
    assert.ok((await sessions.findById(persisted._id)).revokedAt);
    await request('/auth/me', 200, { cookie: rotated.cookie });
    const access = await request('/admin/access', 200, { cookie: rotated.cookie });
    assert.ok(access.data.data.permissions.includes('users:admin'));
    console.log('PASS: generic invalid credentials, anonymous 401, hashed absolute sessions and login rotation');

    for (const role of ['CONTENT_EDITOR', 'RESEARCH_EDITOR', 'ACADEMY_MANAGER', 'VIEWER']) {
      const signedIn = await login(userByRole[role].email);
      await request('/auth/me', 200, { cookie: signedIn.cookie });
      const response = await request('/admin/access', role === 'VIEWER' ? 403 : 200, { cookie: signedIn.cookie });
      if (role !== 'VIEWER') {
        assert.ok(!response.data.data.permissions.includes('users:admin'));
        assert.ok(!response.data.data.permissions.some(p => p.endsWith(':publish')));
      }
      if (role === 'RESEARCH_EDITOR') {
        await users.updateOne({ _id: userByRole[role]._id }, { $set: { role: 'VIEWER' } });
        await request('/admin/access', 403, { cookie: signedIn.cookie });
      }
      if (role === 'CONTENT_EDITOR') {
        await sessions.updateOne({ tokenHash: hashToken(signedIn.token) }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
        await request('/auth/me', 401, { cookie: signedIn.cookie });
      }
      if (role === 'ACADEMY_MANAGER') {
        await users.updateOne({ _id: userByRole[role]._id }, { $set: { enabled: false } });
        await request('/auth/me', 401, { cookie: signedIn.cookie });
        const disabled = await request('/auth/login', 401, { method: 'POST', body: { email: userByRole[role].email, password } });
        assert.deepEqual(disabled.data, unknown.data);
      }
    }
    console.log('PASS: role authorization/403, immediate role changes, expiry and disabled-user denial');

    for (const headers of [
      { Origin: '' }, { Origin: 'null' }, { Origin: 'https://evil.example.invalid' },
      { Origin: 'http://localhost:8080.evil.example.invalid' },
      { 'X-CSRF-Protection': '' }, { 'Content-Type': 'text/plain' },
    ]) {
      await request('/auth/login', 403, { method: 'POST', body: { email: userByRole.VIEWER.email, password }, headers });
      await request('/auth/logout', 403, { method: 'POST', body: {}, cookie: rotated.cookie, headers });
    }
    await request('/auth/logout', 403, { method: 'POST', cookie: rotated.cookie });
    await request('/auth/me', 200, { cookie: rotated.cookie });
    await request('/auth/me', 403, { cookie: rotated.cookie, headers: { Origin: 'https://evil.example.invalid' } });
    const malformed = await request('/auth/login', 400, { method: 'POST', body: `{"password":"${password}"` });
    assertNoSecrets(malformed.data);
    const preflight = await fetch(base + '/auth/login', { method: 'OPTIONS', headers: { Origin: 'http://localhost:3000', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type,x-csrf-protection' } });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get('access-control-allow-origin'), 'http://localhost:3000');
    assert.equal(preflight.headers.get('access-control-allow-credentials'), 'true');
    const denied = await fetch(base + '/auth/login', { method: 'OPTIONS', headers: { Origin: 'https://evil.example.invalid', 'Access-Control-Request-Method': 'POST' } });
    assert.equal(denied.headers.get('access-control-allow-origin'), null);
    console.log('PASS: login/logout CSRF, exact configured-origin CORS and sanitized parser errors');

    const loggedOut = await request('/auth/logout', 200, { method: 'POST', body: {}, cookie: rotated.cookie });
    assert.match(loggedOut.r.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/);
    await request('/auth/me', 401, { cookie: rotated.cookie });
    await request('/auth/logout', 401, { method: 'POST', body: {}, cookie: rotated.cookie });
    assert.ok((await sessions.findOne({ tokenHash: hashToken(rotated.token) })).revokedAt);
    const throttleEmail = 'synthetic-throttle@example.invalid';
    for (let i = 0; i < 5; i++) await request('/auth/login', 401, { method: 'POST', body: { email: throttleEmail, password }, headers: { 'X-Forwarded-For': `192.0.2.${i + 1}` } });
    const throttled = await request('/auth/login', 429, { method: 'POST', body: { email: throttleEmail, password }, headers: { 'X-Forwarded-For': '192.0.2.99' } });
    assert.equal(throttled.r.headers.get('retry-after'), '900');
    const ipRows = await connection.db.collection('login_throttles').find({}).toArray();
    // Every request uses the same untrusted socket IP; forwarded headers cannot create additional IP buckets.
    assert.ok(ipRows.length < 20);
    const auditRows = await audits.find({}).lean();
    assert.ok(auditRows.some(a => a.event === 'login' && a.outcome === 'success'));
    assert.ok(auditRows.some(a => a.outcome === 'invalid_credentials'));
    assert.ok(auditRows.some(a => a.outcome === 'throttled'));
    assert.ok(auditRows.some(a => a.outcome === 'csrf_rejected'));
    assert.ok(auditRows.some(a => a.event === 'logout' && a.outcome === 'success'));
    assertNoSecrets(auditRows);
    for (const row of auditRows) assert.ok(Object.keys(row).every(k => ['_id', '__v', 'event', 'outcome', 'userId', 'createdAt'].includes(k)));
    console.log('PASS: logout revocation, persistent login throttling and credential-free audit records');

    const projects = connection.model('Project', contentDefinitions.projects.schema, contentDefinitions.projects.collection);
    await projects.create({ slug: 'synthetic-step7-regression', title: 'Synthetic regression fixture only', summary: 'Synthetic, not company content', category: 'Synthetic', problem: 'Synthetic', approach: 'Synthetic', status: 'published', publishedAt: new Date(Date.now() - 1000) });
    const publicList = await request('/projects', 200);
    assert.equal(publicList.data.data.length, 1);
    await request('/projects/synthetic-step7-regression', 200);
    const live = await fetch(base + '/health/live'); assert.equal(live.status, 200); assert.deepEqual(await live.json(), { status: 'ok' });
    const ready = await fetch(base + '/health/ready'); assert.equal(ready.status, 200); assert.deepEqual(await ready.json(), { status: 'ok' });
    console.log('PASS: anonymous public content and health behavior preserved');
  } finally {
    if (owned) await connection.dropDatabase();
    await connection.close();
    if (owned) console.log('CLEANUP: isolated Step 7 synthetic database removed');
  }
});
