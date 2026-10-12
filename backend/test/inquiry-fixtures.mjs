import mongoose from 'mongoose';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import passwords from '../dist/auth/password.js';
import definitions from '../dist/auth/auth.schemas.js';
const uri = 'mongodb://mongodb:27017/techyfellow_test_step16?replicaSet=rs0';
assert.equal(process.env.NODE_ENV, 'test'); assert.equal(process.env.MONGODB_URI, uri);
const input = JSON.parse(await new Promise(resolve => { let text = ''; process.stdin.on('data', chunk => text += chunk); process.stdin.on('end', () => resolve(text)); }));
assert.match(input.runId, /^[a-f0-9]{32}$/);
const connection = await mongoose.createConnection(uri).asPromise();
try {
  if (process.argv[2] === 'seed') { assert.equal((await connection.db.listCollections().toArray()).length, 0); await connection.db.collection('synthetic_test_ownership').insertOne({ _id: 'step16', runId: input.runId }); execFileSync(process.execPath, ['dist/content/create-indexes.js'], { stdio: 'pipe' }); const users = connection.model('User', definitions.authDefinitions.user.schema, 'users'); await users.create({ email: 'synthetic-step16-sales@example.invalid', passwordHash: await passwords.hashPassword(input.password), role: 'SALES_MANAGER', enabled: true }); await connection.db.collection('courses').insertOne({ slug: 'synthetic-step16-course', title: 'Synthetic Step16 course', summary: 'Isolated form verification only.', status: 'published', publishedAt: new Date('2026-01-01'), createdAt: new Date(), updatedAt: new Date(), revision: 1, level: 'beginner', prerequisites: [], syllabus: [], deliveryMode: 'live-online', duration: { value: 1, unit: 'hours' } }); console.log('PASS: guarded synthetic database seeded and explicit indexes created'); }
  else { assert.equal((await connection.db.collection('synthetic_test_ownership').findOne({ _id: 'step16' }))?.runId, input.runId); if (process.argv[2] === 'reset-throttles') { await connection.db.collection('lead_throttles').deleteMany({}); console.log('PASS: owned synthetic lead counters reset'); } else if (process.argv[2] === 'inspect') { const count = await connection.db.collection('leads').countDocuments(); console.log('Synthetic persisted leads: ' + count); } else { assert.equal(process.argv[2], 'cleanup'); await connection.dropDatabase(); assert.equal((await connection.db.listCollections().toArray()).length, 0); console.log('PASS: exact owned database dropped and verified empty'); } }
} finally { await connection.close(); }
