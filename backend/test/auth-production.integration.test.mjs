// Production-mode container verification against a separate synthetic database, never production data.
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
const require = createRequire(import.meta.url);
const { authDefinitions } = require('../dist/auth/auth.schemas.js');
const { hashPassword } = require('../dist/auth/password.js');
const exec = promisify(execFile);
const uri = 'mongodb://mongodb:27017/techyfellow_test_step7_production?replicaSet=rs0';
const base = 'http://backend-production-check:4000/api/v1';
const origin = 'https://frontend-host.example';

test('isolated production cookie and spoof-resistant IP throttle', { timeout: 90000 }, async () => {
  assert.equal(process.env.NODE_ENV, 'test');
  assert.equal(process.env.MONGODB_URI, 'mongodb://mongodb:27017/techyfellow_test_step7?replicaSet=rs0');
  const connection = mongoose.createConnection(uri, { autoIndex: false, autoCreate: false, serverSelectionTimeoutMS: 2000 });
  connection.on('error', () => undefined);
  await connection.asPromise();
  let owned = false;
  try {
    assert.equal(connection.name, 'techyfellow_test_step7_production');
    assert.equal((await connection.db.listCollections().toArray()).length, 0, 'Refuse nonempty synthetic database');
    owned = true;
    await exec(process.execPath, ['dist/content/create-indexes.js'], { env: { ...process.env, MONGODB_URI: uri }, timeout: 30000 });
    const users = connection.model('User', authDefinitions.user.schema, authDefinitions.user.collection);
    const password = randomBytes(24).toString('base64url');
    const email = 'synthetic-production-viewer@example.invalid';
    await users.create({ email, passwordHash: await hashPassword(password), role: 'VIEWER', enabled: true });
    const headers = { Origin: origin, 'Content-Type': 'application/json', 'X-CSRF-Protection': '1' };
    const signedIn = await fetch(base + '/auth/login', { method: 'POST', headers, body: JSON.stringify({ email, password }) });
    assert.equal(signedIn.status, 200);
    assert.equal(signedIn.headers.get('access-control-allow-origin'), origin);
    const cookie = signedIn.headers.get('set-cookie');
    assert.ok(cookie.startsWith('__Host-techyfellow_session='));
    for (const option of ['Secure', 'HttpOnly', 'SameSite=Lax', 'Path=/']) assert.ok(cookie.includes(option));
    assert.ok(!cookie.toLowerCase().includes('domain='));
    const cookiePair = cookie.split(';')[0];
    const token = cookiePair.split('=')[1];
    const response = await signedIn.json();
    assert.ok(!JSON.stringify(response).includes(token) && !JSON.stringify(response).includes(password));
    const me = await fetch(base + '/auth/me', { headers: { Cookie: cookiePair } });
    assert.equal(me.status, 200);
    const foreign = await fetch(base + '/auth/logout', { method: 'POST', headers: { ...headers, Cookie: cookiePair, Origin: 'http://localhost:8080' }, body: '{}' });
    assert.equal(foreign.status, 403);
    const logout = await fetch(base + '/auth/logout', { method: 'POST', headers: { ...headers, Cookie: cookiePair }, body: '{}' });
    assert.equal(logout.status, 200);
    const cleared = logout.headers.get('set-cookie');
    assert.ok(cleared.startsWith('__Host-techyfellow_session=;') && cleared.includes('Secure') && cleared.includes('HttpOnly'));
    assert.equal((await fetch(base + '/auth/me', { headers: { Cookie: cookiePair } })).status, 401);
    console.log('PASS: production Secure/HttpOnly host-only cookies, HTTPS origin rules and revocation');
    let blocked = false;
    for (let i = 0; i < 61; i++) {
      const r = await fetch(base + '/auth/login', { method: 'POST', headers: { ...headers, 'X-Forwarded-For': `192.0.2.${(i % 200) + 1}` }, body: JSON.stringify({ email: `synthetic-ip-${i}@example.invalid`, password }) });
      assert.ok([401, 429].includes(r.status));
      if (r.status === 429) { assert.equal(r.headers.get('retry-after'), '900'); blocked = true; break; }
    }
    assert.ok(blocked, 'Forged forwarded headers bypassed IP throttle');
    console.log('PASS: per-IP limit enforced despite changing forged forwarded headers');
  } finally {
    if (owned) await connection.dropDatabase();
    await connection.close();
    if (owned) console.log('CLEANUP: isolated production-mode synthetic database removed');
  }
});
