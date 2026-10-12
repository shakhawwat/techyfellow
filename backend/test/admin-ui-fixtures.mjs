// Verification helper only. Exact isolated database, generated input credentials, explicit ownership and cleanup.
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createRequire } from 'node:module';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
const require = createRequire(import.meta.url);
const { authDefinitions } = require('../dist/auth/auth.schemas.js');
const { hashPassword } = require('../dist/auth/password.js');
assert.equal(process.env.NODE_ENV, 'test');
assert.equal(process.env.MONGODB_URI, 'mongodb://mongodb:27017/techyfellow_test_step9?replicaSet=rs0');
const input = JSON.parse(await new Promise(resolve => { let text = ''; process.stdin.on('data', data => text += data); process.stdin.on('end', () => resolve(text)); }));
assert.match(input.runId, /^[a-f0-9]{32}$/);
const connection = mongoose.createConnection(process.env.MONGODB_URI, { autoCreate: false, autoIndex: false, serverSelectionTimeoutMS: 2000 });
connection.on('error', () => undefined); await connection.asPromise();
try {
  assert.equal(connection.name, 'techyfellow_test_step9');
  const ownership = connection.db.collection('synthetic_test_ownership');
  const action = process.argv[2];
  if (action === 'seed') {
    assert.equal((await connection.db.listCollections().toArray()).length, 0, 'Refuse nonempty database');
    await ownership.insertOne({ _id: 'step9', runId: input.runId, emails: input.users.map(user => user.email) });
    await promisify(execFile)(process.execPath, ['dist/content/create-indexes.js']);
    const users = connection.model('User', authDefinitions.user.schema, authDefinitions.user.collection);
    for (const user of input.users) {
      assert.ok(/^synthetic-step9-[a-z_]+@example\.invalid$/.test(user.email));
      assert.ok(typeof user.password === 'string' && user.password.length >= 12);
      await users.create({ email: user.email, passwordHash: await hashPassword(user.password), role: user.role, enabled: true });
    }
    console.log('PASS: isolated synthetic UI users created; no public content seeded');
  } else {
    const marker = await ownership.findOne({ _id: 'step9', runId: input.runId });
    assert.ok(marker, 'Refuse database without matching ownership');
    if (action === 'cleanup') { await connection.dropDatabase(); console.log('PASS: owned Step 9 synthetic database removed'); }
    else if (action === 'expire') {
      assert.ok(marker.emails.includes(input.email));
      const user = await connection.db.collection('users').findOne({ email: input.email });
      assert.ok(user);
      await connection.db.collection('auth_sessions').updateMany({ userId: user._id }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
      console.log('PASS: only selected synthetic user sessions expired');
    } else throw new Error('Unsupported fixture action');
  }
} finally { await connection.close(); }
