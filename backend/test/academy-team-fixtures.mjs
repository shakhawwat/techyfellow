// Only explicitly synthetic, owned Step 14 data. Refuses real development/production databases.
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const require = createRequire(import.meta.url), { contentDefinitions } = require('../dist/content/content.schemas.js');
const { authDefinitions } = require('../dist/auth/auth.schemas.js'), { hashPassword } = require('../dist/auth/password.js');
const uri = 'mongodb://mongodb:27017/techyfellow_test_step14?replicaSet=rs0';
assert.equal(process.env.NODE_ENV, 'test'); assert.equal(process.env.MONGODB_URI, uri);
const input = JSON.parse(await new Promise(resolve => { let s = ''; process.stdin.on('data', value => s += value); process.stdin.on('end', () => resolve(s)); }));
assert.match(input.runId, /^[a-f0-9]{32}$/);
const c = await mongoose.createConnection(uri, { autoIndex: false, autoCreate: false }).asPromise();
try {
  const marker = c.db.collection('synthetic_test_ownership'), action = process.argv[2];
  if (action === 'seed') {
    assert.equal((await c.db.listCollections().toArray()).length, 0);
    await marker.insertOne({ _id: 'step14', runId: input.runId });
    execFileSync(process.execPath, ['dist/content/create-indexes.js'], { stdio: 'pipe' });
    assert.equal(input.email, 'synthetic-step14-admin@example.invalid'); assert.ok(input.password.length >= 24);
    await c.model('User', authDefinitions.user.schema, 'users').create({ email: input.email, passwordHash: await hashPassword(input.password), role: 'SUPER_ADMIN', enabled: true });
    for (const [kind, definition] of Object.entries(contentDefinitions)) {
      const model = c.model(definition.name, definition.schema, definition.collection);
      for (const status of ['published', 'draft', 'archived', 'future']) {
        const published = status === 'published' || status === 'future';
        const title = `Synthetic ${kind} ${status} fixture`;
        const extras = {
          courses: { level: 'beginner', prerequisites: ['Synthetic prerequisite'], syllabus: [{ title: 'Synthetic module', topics: ['Synthetic topic'] }], duration: { value: 6, unit: 'weeks' }, deliveryMode: 'live-online', seo: { title: 'Synthetic Course SEO', description: 'Clearly synthetic course SEO description.' } },
          team: { biography: 'Synthetic biography.\n<script>window.syntheticBiographyUnsafe=true</script>', expertise: ['Synthetic expertise'], profileLinks: [{ label: 'Approved synthetic profile', url: 'https://profiles.example.invalid/approved', approved: true }, { label: 'Unapproved synthetic profile', url: 'https://profiles.example.invalid/unapproved', approved: false }], seo: { canonicalUrl: 'https://canonical.example.invalid/team/synthetic-team-published' } },
          projects: { category: 'Synthetic category', problem: 'Synthetic problem.', approach: 'Synthetic approach.', media: [] },
          research: { domain: 'Synthetic domain', researchStage: 'active' },
          publications: { authors: ['Synthetic Author'], venue: 'Synthetic venue', year: 2026 },
        }[kind];
        const record = await model.create({ slug: `synthetic-${kind}-${status}`, ...(kind === 'team' ? { name: title } : { title }), summary: 'Clearly synthetic isolated Step 14 verification content.', status: published ? 'published' : status, publishedAt: published ? new Date(Date.now() + (status === 'future' ? 86400000 : -86400000)) : undefined, ...extras });
        if (status === 'published' && kind === 'courses') await model.collection.updateOne({ _id: record._id }, { $set: { instructor: 'Synthetic Unverified Instructor', price: 9999, cohortDates: ['2099-01-01'], hardwareRequirements: ['Synthetic Unverified Hardware'], certificate: 'Synthetic Unverified Certificate' } });
        if (status === 'published' && kind === 'team') await model.collection.updateOne({ _id: record._id }, { $set: { imageUrl: 'https://unapproved.example.invalid/photo.webp' }, $push: { profileLinks: { $each: [{ label: 'Unsafe synthetic profile', url: 'javascript:alert(1)', approved: true }, { label: 'Credentialed synthetic profile', url: 'https://synthetic-user:synthetic-pass@profiles.example.invalid', approved: true }] } } });
      }
      if (kind === 'courses' || kind === 'team') {
        for (let i = 1; i <= 21; i++) {
          const extras = kind === 'courses' ? { level: 'advanced', prerequisites: [], syllabus: [], duration: { value: 2, unit: 'hours' }, deliveryMode: 'self-paced' } : { biography: 'Clearly synthetic pagination biography.', expertise: ['Synthetic alternate expertise'], profileLinks: [] };
          await model.create({ slug: `synthetic-${kind}-pagination-${i}`, ...(kind === 'team' ? { name: `Synthetic team pagination ${String(i).padStart(2, '0')}` } : { title: `Synthetic courses pagination ${String(i).padStart(2, '0')}` }), summary: 'Clearly synthetic pagination content.', status: 'published', publishedAt: new Date(Date.now() - 172800000), ...extras });
        }
      }
    }
    console.log('PASS: owned synthetic course/team/status/pagination/approval and public-regression fixtures seeded');
  } else {
    assert.ok(await marker.findOne({ _id: 'step14', runId: input.runId }));
    if (action === 'empty') { for (const definition of Object.values(contentDefinitions)) await c.db.collection(definition.collection).deleteMany({}); console.log('PASS: only owned synthetic content collections emptied'); }
    else if (action === 'cleanup') { await c.dropDatabase(); assert.equal((await c.db.listCollections().toArray()).length, 0); console.log('PASS: exact owned Step 14 database dropped and verified empty'); }
    else throw Error('Unsupported action');
  }
} finally { await c.close(); }
