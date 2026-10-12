// Clearly synthetic content, guarded exact isolated test DB and ownership marker. Never run on real data.
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const require = createRequire(import.meta.url), { contentDefinitions } = require('../dist/content/content.schemas.js');
const uri = 'mongodb://mongodb:27017/techyfellow_test_step12?replicaSet=rs0';
assert.equal(process.env.NODE_ENV, 'test'); assert.equal(process.env.MONGODB_URI, uri);
const input = JSON.parse(await new Promise(resolve => { let s = ''; process.stdin.on('data', d => s += d); process.stdin.on('end', () => resolve(s)); }));
assert.match(input.runId, /^[a-f0-9]{32}$/);
const c = await mongoose.createConnection(uri, { autoCreate: false, autoIndex: false }).asPromise();
try {
  const marker = c.db.collection('synthetic_test_ownership'), action = process.argv[2];
  if (action === 'seed' || action === 'restore') {
    if (action === 'seed') {
      assert.equal((await c.db.listCollections().toArray()).length, 0);
      await marker.insertOne({ _id: 'step12', runId: input.runId });
      execFileSync(process.execPath, ['dist/content/create-indexes.js'], { stdio: 'pipe' });
    } else {
      assert.ok(await marker.findOne({ _id: 'step12', runId: input.runId }));
      for (const kind of ['projects', 'research', 'publications']) assert.equal(await c.db.collection(contentDefinitions[kind].collection).countDocuments(), 0);
    }
    for (const kind of ['projects', 'research', 'publications']) {
      const def = contentDefinitions[kind], model = c.model(def.name, def.schema, def.collection);
      for (const status of ['published', 'draft', 'archived', 'future']) {
        const published = status === 'published' || status === 'future';
        const extra = {
          projects: { category: 'Synthetic category', problem: 'Synthetic problem.\n<script>window.syntheticUnsafe=true</script>', approach: 'Synthetic approach.', technologies: ['Synthetic tool'], results: ['Synthetic documented result.'], media: [] },
          research: { domain: 'Synthetic domain', researchStage: 'active', methods: ['Synthetic method'], contributors: [{ name: 'Synthetic Contributor' }] },
          publications: { authors: ['Synthetic Author'], venue: 'Synthetic venue', year: 2026, doi: '10.1234/synthetic-verification', publisherUrl: 'https://publisher.example.invalid/synthetic', seo: { title: 'Synthetic publication SEO', description: 'Synthetic publication SEO description.', canonicalUrl: 'https://canonical.example.invalid/publications/synthetic-publications-published' } },
        }[kind];
        await model.create({ slug: `synthetic-${kind}-${status}`, title: `Synthetic ${kind} ${status} fixture`, summary: 'Clearly synthetic isolated Step 12 verification content.', status: published ? 'published' : status, publishedAt: published ? new Date(Date.now() + (status === 'future' ? 86400000 : -86400000)) : undefined, ...extra });
      }
      for (let i = 1; i <= 22; i++) {
        const extra = {
          projects: { category: 'Synthetic alternate', problem: 'Synthetic pagination problem.', approach: 'Synthetic pagination approach.', technologies: ['Alternate tool'], media: [] },
          research: { domain: 'Synthetic alternate', researchStage: 'completed', methods: [], contributors: [] },
          publications: { authors: ['Synthetic Alternate Author'], venue: 'Synthetic alternate', year: 2025 },
        }[kind];
        await model.create({ slug: `synthetic-${kind}-pagination-${i}`, title: `Synthetic ${kind} pagination ${String(i).padStart(2, '0')}`, summary: 'Clearly synthetic pagination content.', status: 'published', publishedAt: new Date(Date.now() - 172800000), ...extra });
      }
    }
    console.log('PASS: guarded synthetic published/draft/archived/future and pagination fixtures created');
  } else {
    assert.ok(await marker.findOne({ _id: 'step12', runId: input.runId }));
    if (action === 'empty') {
      for (const kind of ['projects', 'research', 'publications']) await c.db.collection(contentDefinitions[kind].collection).deleteMany({});
      console.log('PASS: only owned synthetic content emptied');
    } else if (action === 'cleanup') {
      await c.dropDatabase(); assert.equal((await c.db.listCollections().toArray()).length, 0);
      console.log('PASS: exact owned Step 12 DB dropped and verified empty');
    } else throw Error('Unsupported action');
  }
} finally { await c.close(); }
