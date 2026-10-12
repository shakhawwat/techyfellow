// Guarded, explicitly synthetic regression fixtures; never use production/development content.
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { contentDefinitions } = require('../dist/content/content.schemas.js');
const { authDefinitions } = require('../dist/auth/auth.schemas.js');
const { hashPassword } = require('../dist/auth/password.js');
const uri = 'mongodb://mongodb:27017/techyfellow_test_step13?replicaSet=rs0';
assert.equal(process.env.NODE_ENV, 'test'); assert.equal(process.env.MONGODB_URI, uri);
const input = JSON.parse(await new Promise(resolve => { let text = ''; process.stdin.on('data', chunk => text += chunk); process.stdin.on('end', () => resolve(text)); }));
assert.match(input.runId, /^[a-f0-9]{32}$/);
const connection = await mongoose.createConnection(uri, { autoIndex: false, autoCreate: false }).asPromise();
try {
  const marker = connection.db.collection('synthetic_test_ownership');
  if (process.argv[2] === 'seed') {
    assert.equal((await connection.db.listCollections().toArray()).length, 0);
    await marker.insertOne({ _id: 'step13', runId: input.runId });
    execFileSync(process.execPath, ['dist/content/create-indexes.js'], { stdio: 'pipe' });
    assert.equal(input.email, 'synthetic-step13-admin@example.invalid'); assert.ok(input.password.length >= 24);
    const users = connection.model('User', authDefinitions.user.schema, 'users');
    await users.create({ email: input.email, passwordHash: await hashPassword(input.password), role: 'SUPER_ADMIN', enabled: true });
    for (const kind of ['projects', 'research', 'publications']) {
      const definition = contentDefinitions[kind], model = connection.model(definition.name, definition.schema, definition.collection);
      for (const status of ['published', 'draft', 'archived', 'future']) {
        const published = status === 'published' || status === 'future';
        const extras = {
          projects: { category: 'Robotics', problem: 'Synthetic problem.', approach: 'Synthetic approach.', technologies: ['Synthetic robotics tool'], results: ['Synthetic test result.'], media: [] },
          research: { domain: 'Robotics', researchStage: 'active', methods: ['Synthetic method'], contributors: [{ name: 'Synthetic Contributor' }] },
          publications: { authors: ['Synthetic Author'], venue: 'Synthetic venue', year: 2026 },
        }[kind];
        await model.create({ slug: `synthetic-${kind}-${status}`, title: `Synthetic Robotics ${kind} ${status}`, summary: 'Explicitly synthetic Step 13 regression record. Not company work.', status: published ? 'published' : status, publishedAt: published ? new Date(Date.now() + (status === 'future' ? 86400000 : -86400000)) : undefined, ...extras });
      }
    }
    console.log('PASS: owned synthetic public regression records and private admin seeded');
  } else if (process.argv[2] === 'cleanup') {
    assert.ok(await marker.findOne({ _id: 'step13', runId: input.runId }));
    await connection.dropDatabase(); assert.equal((await connection.db.listCollections().toArray()).length, 0);
    console.log('PASS: exact owned Step 13 test database dropped and verified empty');
  } else throw Error('Unsupported test action');
} finally { await connection.close(); }
