// Clearly synthetic fixtures, restricted to a private Step 6 test database.
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createRequire } from 'node:module';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const require = createRequire(import.meta.url);
const { contentDefinitions } = require('../dist/content/content.schemas.js');
const exec = promisify(execFile);
const uri = 'mongodb://mongodb:27017/techyfellow_test_step6?replicaSet=rs0';
const sentinel = 'SYNTHETIC_INTERNAL_DO_NOT_EXPOSE';
const base = 'http://127.0.0.1:4000/api/v1';

function fields(kind) {
  const title = 'Synthetic Alpha — test fixture only';
  switch (kind) {
    case 'projects': return { title, category: 'Synthetic category', problem: 'Synthetic problem', approach: 'Synthetic approach', technologies: ['Synthetic technology'], results: ['Synthetic result, not company content'], media: [{ reference: 'synthetic-fixture', type: 'document', altText: 'Synthetic reference only' }] };
    case 'research': return { title, domain: 'Synthetic domain', methods: ['Synthetic method'], researchStage: 'active', contributors: [{ name: 'Synthetic contributor', teamSlug: 'synthetic-step6-team-a' }] };
    case 'publications': return { title, authors: ['Synthetic author'], venue: 'Synthetic venue', year: 2026, doi: '10.9999/synthetic-test-only', publisherUrl: 'https://example.invalid/synthetic' };
    case 'team': return { name: title, biography: 'Synthetic biography, not a real person', expertise: ['Synthetic expertise'], profileLinks: [{ label: 'Synthetic approved link', url: 'https://example.invalid/approved', approved: true }, { label: 'Synthetic unapproved link', url: 'https://example.invalid/unapproved', approved: false }] };
    case 'courses': return { title, level: 'beginner', prerequisites: ['Synthetic prerequisite'], syllabus: [{ title: 'Synthetic lesson', topics: ['Synthetic topic'] }], deliveryMode: 'self-paced', duration: { value: 2, unit: 'hours' } };
  }
}
function assertPublic(value) {
  assert.ok(!JSON.stringify(value).includes(sentinel));
  if (Array.isArray(value)) return value.forEach(assertPublic);
  if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) {
    assert.ok(!['_id', '__v', 'status', 'createdAt', 'updatedAt', 'internalNotes', 'approved', 'privateUrl'].includes(key), `Internal key leaked: ${key}`);
    assertPublic(child);
  }
}
async function request(path, expected) {
  const r = await fetch(base + path);
  assert.equal(r.status, expected, path);
  const body = await r.json();
  if (expected >= 400) {
    assert.deepEqual(Object.keys(body), ['error']);
    assert.deepEqual(Object.keys(body.error).sort(), ['code', 'message']);
    assert.ok(!JSON.stringify(body).includes('Mongo'));
    assert.ok(!JSON.stringify(body).includes('stack'));
  }
  return body;
}

test('isolated synthetic content API/database verification', { timeout: 90000 }, async () => {
  // Refuse before any database operations if invoked against a different environment.
  assert.equal(process.env.NODE_ENV, 'test', 'Requires NODE_ENV=test');
  assert.equal(process.env.MONGODB_URI, uri, 'Requires the exact isolated development test URI');
  const connection = mongoose.createConnection(uri, { autoCreate: false, autoIndex: false, serverSelectionTimeoutMS: 2000 });
  connection.on('error', () => undefined);
  await connection.asPromise();
  let owned = false;
  try {
    assert.equal(connection.name, 'techyfellow_test_step6');
    assert.equal((await connection.db.listCollections().toArray()).length, 0, 'Refuse a nonempty test database');
    owned = true;
    await exec(process.execPath, ['dist/content/create-indexes.js'], { timeout: 30000 });
    console.log('PASS: explicit index command executed on the empty isolated test database');
    const now = Date.now();
    for (const [kind, definition] of Object.entries(contentDefinitions)) {
      const model = connection.model(definition.name, definition.schema, definition.collection);
      const prefix = `synthetic-step6-${kind}`;
      const common = { ...fields(kind), summary: 'Clearly synthetic fixture — not public company content', seo: { title: 'Synthetic SEO', description: 'Synthetic fixture only', canonicalUrl: 'https://example.invalid/synthetic' } };
      for (const [suffix, status, publishedAt] of [
        ['a', 'published', new Date(now - 172800000)], ['b', 'published', new Date(now - 86400000)],
        ['draft', 'draft', new Date(now - 86400000)], ['archived', 'archived', new Date(now - 86400000)],
        ['future', 'published', new Date(now + 604800000)],
      ]) {
        const data = { ...common, slug: `${prefix}-${suffix}`, status, publishedAt };
        if (suffix === 'b') data[kind === 'team' ? 'name' : 'title'] = 'Synthetic Beta — test fixture only';
        await model.create(data);
      }
      await assert.rejects(model.create({ ...common, slug: `${prefix}-undated`, status: 'published' }), e => e.name === 'ValidationError');
      await model.collection.insertOne({ ...common, slug: `${prefix}-null-date`, status: 'published', publishedAt: null });
      const update = { internalNotes: sentinel, 'seo.internalNotes': sentinel };
      if (kind === 'projects') update['media.0.privateUrl'] = sentinel;
      if (kind === 'research') update['contributors.0.internalNotes'] = sentinel;
      if (kind === 'courses') { update['syllabus.0.internalNotes'] = sentinel; update['duration.internalNotes'] = sentinel; }
      if (kind === 'team') { update['profileLinks.0.internalNotes'] = sentinel; }
      await model.collection.updateOne({ slug: `${prefix}-a` }, { $set: update });
      if (kind === 'team') await model.collection.updateOne({ slug: `${prefix}-a` }, { $push: { profileLinks: { label: 'Synthetic unsafe URL', url: 'javascript:alert(1)', approved: true } } });
      await assert.rejects(model.create({ ...common, slug: `${prefix}-a`, status: 'draft' }), e => e.code === 11000);
      const indexes = await model.collection.indexes();
      assert.ok(indexes.some(index => index.name === 'slug_unique' && index.unique));
      assert.ok(indexes.some(index => index.name === 'public_published_at'));
      const list = await request(`/${kind}`, 200);
      assert.deepEqual(list.pagination, { page: 1, limit: 20, total: 2, totalPages: 1 });
      assert.deepEqual(list.data.map(record => record.slug), [`${prefix}-b`, `${prefix}-a`]);
      assertPublic(list);
      assert.deepEqual((await request(`/${kind}/`, 200)).data, list.data);
      const paged = await request(`/${kind}?page=2&limit=1`, 200);
      assert.deepEqual(paged.pagination, { page: 2, limit: 1, total: 2, totalPages: 2 });
      assert.equal(paged.data[0].slug, `${prefix}-a`);
      const titleSort = kind === 'team' ? 'name' : 'title';
      assert.equal((await request(`/${kind}?sort=${titleSort}`, 200)).data[0].slug, `${prefix}-a`);
      const detail = await request(`/${kind}/${prefix}-a`, 200);
      assert.deepEqual(Object.keys(detail), ['data']);
      assertPublic(detail);
      if (kind === 'team') assert.deepEqual(detail.data.profileLinks, [{ label: 'Synthetic approved link', url: 'https://example.invalid/approved' }]);
      if (kind === 'research') assert.equal(detail.data.researchStage, 'active');
      for (const suffix of ['draft', 'archived', 'future', 'null-date', 'missing']) {
        const error = await request(`/${kind}/${prefix}-${suffix}`, 404);
        assert.deepEqual(error, { error: { code: 'NOT_FOUND', message: 'Content not found.' } });
      }
      const filter = { projects: 'technology=Synthetic%20technology', research: 'researchStage=active', publications: 'year=2026', team: 'expertise=Synthetic%20expertise', courses: 'level=beginner&deliveryMode=self-paced' }[kind];
      assert.equal((await request(`/${kind}?${filter}`, 200)).pagination.total, 2);
      for (const query of ['page=0', 'page=-1', 'page=1.5', 'page=NaN', 'page=9007199254740991&limit=100', 'limit=0', 'limit=101', 'limit=1&limit=2', 'sort=%24where', 'sort=slug', 'sort=publishedAt,title', 'status=draft', 'unknown=value', 'category%5B%24ne%5D=anything']) {
        await request(`/${kind}?${query}`, 400);
      }
      await request(`/${kind}/${prefix}-a?status=draft`, 400);
      const write = await fetch(base + `/${kind}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      assert.equal(write.status, 404);
      console.log(`PASS: ${kind} visibility, detail 404s, pagination/sort/filter validation, unique slug and explicit DTOs`);
    }
    await request('/research?researchStage=published', 400);
    await request('/courses?level=expert', 400);
    await request('/courses?deliveryMode=unknown', 400);
    await request('/publications?year=2026.5', 400);
    assert.equal((await request('/projects?category=%7B%22%24ne%22%3Anull%7D', 200)).data.length, 0, 'Filter strings never become query operators');
    await exec(process.execPath, ['dist/content/create-indexes.js'], { timeout: 30000 });
    console.log('PASS: enum/numeric filtering, injection resistance and repeatable nondestructive index command');
  } finally {
    // Only the guarded, isolated test database is removed; the container volume remains.
    if (owned) await connection.dropDatabase();
    await connection.close();
    if (owned) console.log('PASS: isolated synthetic test database removed');
  }
});
