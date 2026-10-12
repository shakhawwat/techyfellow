// Clearly synthetic fixtures, random credentials, and an exact isolated replica-set database only.
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const require = createRequire(import.meta.url);
const { authDefinitions } = require('../dist/auth/auth.schemas.js');
const { contentDefinitions } = require('../dist/content/content.schemas.js');
const { hashPassword } = require('../dist/auth/password.js');
const exec = promisify(execFile);
const uri = 'mongodb://mongodb:27017/techyfellow_test_step8?replicaSet=rs0';
const base = 'http://127.0.0.1:4000/api/v1';
const secrets = [];
const roleResources = { SUPER_ADMIN: ['projects', 'research', 'publications', 'team', 'courses'], CONTENT_EDITOR: ['projects', 'team'], RESEARCH_EDITOR: ['research', 'publications'], ACADEMY_MANAGER: ['courses'], VIEWER: [] };
const editorFor = { projects: 'CONTENT_EDITOR', research: 'RESEARCH_EDITOR', publications: 'RESEARCH_EDITOR', team: 'CONTENT_EDITOR', courses: 'ACADEMY_MANAGER' };
const identity = kind => kind === 'team' ? 'name' : 'title';
const minimal = (kind, suffix = '') => ({ slug: `synthetic-step8-${kind}${suffix}`, [identity(kind)]: 'Synthetic fixture only' });
function fields(kind) {
  const common = { summary: 'Synthetic test content, not company facts', seo: { title: 'Synthetic SEO', canonicalUrl: 'https://example.invalid/synthetic' } };
  switch (kind) {
    case 'projects': return { ...common, category: 'Synthetic category', problem: 'Synthetic problem', approach: 'Synthetic approach', technologies: ['Synthetic technology'], results: ['Synthetic result only'], media: [] };
    case 'research': return { ...common, domain: 'Synthetic domain', methods: ['Synthetic method'], researchStage: 'active', contributors: [{ name: 'Synthetic contributor' }] };
    case 'publications': return { ...common, authors: ['Synthetic author'], venue: 'Synthetic venue', year: 2026, doi: '10.9999/synthetic-test-only', publisherUrl: 'https://example.invalid/synthetic' };
    case 'team': return { ...common, biography: 'Synthetic biography, not a real person', expertise: ['Synthetic expertise'], profileLinks: [{ label: 'Synthetic unapproved', url: 'https://example.invalid/unapproved', approved: false }] };
    case 'courses': return { ...common, level: 'beginner', prerequisites: ['Synthetic prerequisite'], syllabus: [{ title: 'Synthetic lesson', topics: ['Synthetic topic'] }], deliveryMode: 'self-paced', duration: { value: 2, unit: 'hours' } };
  }
}
function safe(value) {
  const json = JSON.stringify(value);
  for (const secret of secrets) assert.ok(!json.includes(secret), 'Synthetic credential/session secret leaked');
  if (Array.isArray(value)) return value.forEach(safe);
  if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) {
    assert.ok(!['_id', '__v', 'passwordHash', 'token', 'tokenHash', 'sessionId', 'internalNotes', 'stack'].includes(key), `Internal response field: ${key}`);
    safe(child);
  }
}
async function request(path, expected, { role, method = 'GET', body, headers = {} } = {}, actors = {}) {
  const r = await fetch(base + path, { method, headers: { ...(body !== undefined ? { Origin: 'http://localhost:8080', 'Content-Type': 'application/json', 'X-CSRF-Protection': '1' } : {}), ...(role ? { Cookie: actors[role].cookie } : {}), ...headers }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  assert.equal(r.status, expected, `${method} ${path} (${role ?? 'anonymous'})`);
  const value = await r.json(); safe(value);
  if (path.startsWith('/admin/')) assert.equal(r.headers.get('cache-control'), 'no-store');
  if (expected >= 400) assert.ok(value.error?.code && value.error?.message);
  return value;
}

test('isolated protected content flows and actual transactional audit rollback', { timeout: 120000 }, async () => {
  assert.equal(process.env.NODE_ENV, 'test');
  assert.equal(process.env.MONGODB_URI, uri, 'Requires exact isolated Step 8 URI');
  const connection = mongoose.createConnection(uri, { autoCreate: false, autoIndex: false, serverSelectionTimeoutMS: 2000 });
  connection.on('error', () => undefined); await connection.asPromise();
  let owned = false;
  try {
    assert.equal(connection.name, 'techyfellow_test_step8');
    assert.equal((await connection.db.listCollections().toArray()).length, 0, 'Refuse nonempty test database'); owned = true;
    await exec(process.execPath, ['dist/content/create-indexes.js'], { timeout: 30000 });
    const users = connection.model('User', authDefinitions.user.schema, authDefinitions.user.collection);
    const audit = connection.db.collection('content_audits');
    assert.ok((await audit.indexes()).some(i => i.name === 'content_revision_unique' && i.unique));
    const password = randomBytes(24).toString('base64url'); secrets.push(password);
    const passwordHash = await hashPassword(password); secrets.push(passwordHash);
    const actors = {};
    for (const role of Object.keys(roleResources)) {
      const user = await users.create({ email: `synthetic-step8-${role.toLowerCase()}@example.invalid`, passwordHash, role, enabled: true });
      const r = await fetch(base + '/auth/login', { method: 'POST', headers: { Origin: 'http://localhost:8080', 'Content-Type': 'application/json', 'X-CSRF-Protection': '1' }, body: JSON.stringify({ email: user.email, password }) });
      assert.equal(r.status, 200);
      const cookie = r.headers.get('set-cookie').split(';')[0]; secrets.push(cookie.split('=')[1]);
      safe(await r.json()); actors[role] = { cookie, id: String(user._id) };
    }
    const req = (path, status, options = {}) => request(path, status, options, actors);
    const checkAudit = async (kind, action, role, data) => {
      const rows = await audit.find({ resource: kind, contentId: new mongoose.Types.ObjectId(data.id), revision: data.revision }).toArray();
      assert.equal(rows.length, 1); assert.equal(rows[0].action, action); assert.equal(String(rows[0].actor), actors[role].id);
      assert.ok(rows[0].createdAt instanceof Date);
      assert.ok(Object.keys(rows[0]).every(k => ['_id', '__v', 'actor', 'action', 'resource', 'contentId', 'revision', 'createdAt'].includes(k)));
    };
    const snapshot = async (collection, id) => ({ record: await collection.findOne({ _id: new mongoose.Types.ObjectId(id) }), auditCount: await audit.countDocuments({}) });
    const unchanged = async (collection, id, before) => assert.deepEqual(await snapshot(collection, id), before);
    for (const [kind, definition] of Object.entries(contentDefinitions)) {
      const collection = connection.db.collection(definition.collection);
      const path = `/admin/${kind}`;
      const editor = editorFor[kind];
      const created = (await req(path, 201, { role: editor, method: 'POST', body: minimal(kind) })).data;
      assert.equal(created.status, 'draft'); assert.equal(created.revision, 1);
      await checkAudit(kind, 'create', editor, created);
      const detail = `${path}/${created.id}`;
      for (const [role, allowed] of Object.entries(roleResources)) {
        const canRead = role === 'VIEWER' || allowed.includes(kind);
        await req(path, canRead ? 200 : 403, { role });
        await req(detail, canRead ? 200 : 403, { role });
        if (!allowed.includes(kind)) {
          await req(path, 403, { role, method: 'POST', body: minimal(kind, '-forbidden') });
          await req(detail, 403, { role, method: 'PATCH', body: { revision: 1, summary: 'Synthetic' } });
          await req(detail + '/archive', 403, { role, method: 'POST', body: { revision: 1 } });
        }
        if (role !== 'SUPER_ADMIN') for (const action of ['publish', 'unpublish']) await req(`${detail}/${action}`, 403, { role, method: 'POST', body: { revision: 1 } });
      }
      for (const [endpoint, method, body] of [[path, 'GET'], [detail, 'GET'], [path, 'POST', minimal(kind, '-anonymous')], [detail, 'PATCH', { revision: 1, summary: 'Synthetic' }], ...['publish', 'unpublish', 'archive'].map(action => [`${detail}/${action}`, 'POST', { revision: 1 }])]) await req(endpoint, 401, { method, body });
      const list = await req(`${path}?status=draft&limit=1&page=1&sort=-revision`, 200, { role: 'VIEWER' });
      assert.equal(list.data[0].id, created.id); assert.deepEqual(list.pagination, { page: 1, limit: 1, total: 1, totalPages: 1 });
      await req(`/${kind}/${created.slug}`, 404);
      let before = await snapshot(collection, created.id);
      const invalidPublish = await req(detail + '/publish', 400, { role: 'SUPER_ADMIN', method: 'POST', body: { revision: 1 } });
      assert.ok(invalidPublish.error.fields.includes('summary')); await unchanged(collection, created.id, before);
      for (const property of ['status', 'publishedAt', '_id', '__v', 'createdAt', 'updatedAt', 'actor']) {
        await req(detail, 400, { role: editor, method: 'PATCH', body: { revision: 1, [property]: 'synthetic-protected' } });
      }
      await req(path, 400, { role: editor, method: 'POST', body: { ...minimal(kind, '-status'), status: 'published' } });
      await req(path, 409, { role: editor, method: 'POST', body: minimal(kind) });
      await unchanged(collection, created.id, before);
      await req(`${path}/invalid-id`, 400, { role: editor });
      await req(`${path}/${new mongoose.Types.ObjectId()}`, 404, { role: editor });
      await req(`${path}/${new mongoose.Types.ObjectId()}`, 404, { role: editor, method: 'PATCH', body: { revision: 1, summary: 'Synthetic' } });
      for (const query of ['page=0', 'limit=101', 'page=1.1', 'sort=$where', 'sort=title,slug', 'status=unknown', 'status=draft&status=published', 'status[$ne]=draft', 'unknown=x', 'slug=bad%20slug']) await req(`${path}?${query}`, 400, { role: editor });
      await req(detail + '?page=1', 400, { role: editor });
      await req(detail, 400, { role: editor, method: 'PATCH', body: { revision: '1', summary: 'Synthetic' } });
      await req(detail, 403, { role: editor, method: 'PATCH', body: { revision: 1, summary: 'Synthetic' }, headers: { 'X-CSRF-Protection': '' } });
      const edited = (await req(detail, 200, { role: editor, method: 'PATCH', body: { revision: 1, ...fields(kind) } })).data;
      assert.equal(edited.revision, 2); await checkAudit(kind, 'edit', editor, edited);
      const published = (await req(detail + '/publish', 200, { role: 'SUPER_ADMIN', method: 'POST', body: { revision: 2 } })).data;
      assert.equal(published.status, 'published'); assert.equal(published.revision, 3); await checkAudit(kind, 'publish', 'SUPER_ADMIN', published);
      const visible = await req(`/${kind}/${created.slug}`, 200); assert.ok(!('revision' in visible.data) && !('status' in visible.data));
      before = await snapshot(collection, created.id);
      await req(detail, 403, { role: editor, method: 'PATCH', body: { revision: 3, summary: 'Synthetic unauthorized published edit' } });
      await req(detail + '/archive', 403, { role: editor, method: 'POST', body: { revision: 3 } });
      await unchanged(collection, created.id, before);
      const publishedEdit = (await req(detail, 200, { role: 'SUPER_ADMIN', method: 'PATCH', body: { revision: 3, summary: 'Synthetic authorized published edit' } })).data;
      assert.equal(publishedEdit.revision, 4); await checkAudit(kind, 'edit', 'SUPER_ADMIN', publishedEdit);
      assert.equal((await req(`/${kind}/${created.slug}`, 200)).data.summary, publishedEdit.summary);
      before = await snapshot(collection, created.id);
      await req(detail, 400, { role: 'SUPER_ADMIN', method: 'PATCH', body: { revision: 4, summary: null } }); await unchanged(collection, created.id, before);
      const unpublished = (await req(detail + '/unpublish', 200, { role: 'SUPER_ADMIN', method: 'POST', body: { revision: 4 } })).data;
      assert.equal(unpublished.status, 'draft'); assert.equal(unpublished.revision, 5); assert.ok(!unpublished.publishedAt); await checkAudit(kind, 'unpublish', 'SUPER_ADMIN', unpublished);
      await req(`/${kind}/${created.slug}`, 404);
      await req(detail, 409, { role: editor, method: 'PATCH', body: { revision: 4, summary: 'Synthetic stale edit' } });
      const concurrent = await Promise.all([0, 1].map(i => fetch(base + detail, { method: 'PATCH', headers: { Cookie: actors[editor].cookie, Origin: 'http://localhost:8080', 'Content-Type': 'application/json', 'X-CSRF-Protection': '1' }, body: JSON.stringify({ revision: 5, [identity(kind)]: `Synthetic concurrent ${i}` }) })));
      assert.deepEqual(concurrent.map(r => r.status).sort(), [200, 409]);
      const concurrentData = await Promise.all(concurrent.map(r => r.json())); concurrentData.forEach(safe);
      const winner = concurrentData.find(item => item.data).data; assert.equal(winner.revision, 6); await checkAudit(kind, 'edit', editor, winner);
      const archived = (await req(detail + '/archive', 200, { role: editor, method: 'POST', body: { revision: 6 } })).data;
      assert.equal(archived.status, 'archived'); assert.equal(archived.revision, 7); await checkAudit(kind, 'archive', editor, archived);
      assert.equal((await collection.findOne({ _id: new mongoose.Types.ObjectId(created.id) })).status, 'archived');
      for (const action of ['publish', 'unpublish', 'archive']) await req(`${detail}/${action}`, 409, { role: 'SUPER_ADMIN', method: 'POST', body: { revision: 7 } });
      await req(detail, 409, { role: 'SUPER_ADMIN', method: 'PATCH', body: { revision: 7, summary: 'Synthetic archived edit' } });
      await req(`/${kind}/${created.slug}`, 404);
      assert.equal(await audit.countDocuments({ resource: kind, contentId: new mongoose.Types.ObjectId(created.id) }), 7);
      console.log(`PASS: ${kind} permission matrix, lifecycle, visibility, strict validation, stale/concurrent revisions and matching audits`);
    }
    const preflight = await fetch(base + '/admin/projects', { method: 'OPTIONS', headers: { Origin: 'http://localhost:3000', 'Access-Control-Request-Method': 'PATCH', 'Access-Control-Request-Headers': 'content-type,x-csrf-protection' } });
    assert.equal(preflight.status, 204); assert.ok(preflight.headers.get('access-control-allow-methods').includes('PATCH'));
    const projects = connection.db.collection('projects');
    const scheduled = (await req('/admin/projects', 201, { role: 'SUPER_ADMIN', method: 'POST', body: { ...minimal('projects', '-scheduled'), ...fields('projects') } })).data;
    const scheduledPath = `/admin/projects/${scheduled.id}`;
    const future = new Date(Date.now() + 604800000).toISOString();
    const scheduledPublished = (await req(scheduledPath + '/publish', 200, { role: 'SUPER_ADMIN', method: 'POST', body: { revision: 1, publishedAt: future } })).data;
    assert.equal(scheduledPublished.publishedAt, future); await checkAudit('projects', 'publish', 'SUPER_ADMIN', scheduledPublished);
    await req(`/projects/${scheduled.slug}`, 404);
    await req(scheduledPath, 403, { role: 'CONTENT_EDITOR', method: 'PATCH', body: { revision: 2, summary: 'Synthetic scheduled bypass' } });
    const scheduledArchive = (await req(scheduledPath + '/archive', 200, { role: 'SUPER_ADMIN', method: 'POST', body: { revision: 2 } })).data;
    await checkAudit('projects', 'archive', 'SUPER_ADMIN', scheduledArchive);

    const legacy = await projects.insertOne({ ...minimal('projects', '-legacy'), ...fields('projects'), status: 'draft', createdAt: new Date(), updatedAt: new Date(), internalNotes: 'SYNTHETIC_PRIVATE', __v: 9 });
    const legacyPath = `/admin/projects/${legacy.insertedId}`;
    assert.equal((await req(legacyPath, 200, { role: 'VIEWER' })).data.revision, 1);
    const upgraded = (await req(legacyPath, 200, { role: 'CONTENT_EDITOR', method: 'PATCH', body: { revision: 1, summary: 'Synthetic legacy revision' } })).data;
    assert.equal(upgraded.revision, 2); await checkAudit('projects', 'edit', 'CONTENT_EDITOR', upgraded);
    await req(legacyPath, 409, { role: 'CONTENT_EDITOR', method: 'PATCH', body: { revision: 1, summary: 'Synthetic stale legacy' } });
    const duplicateTarget = (await req('/admin/projects', 201, { role: 'CONTENT_EDITOR', method: 'POST', body: minimal('projects', '-duplicate-target') })).data;
    const duplicateBefore = await snapshot(projects, duplicateTarget.id);
    await req(`/admin/projects/${duplicateTarget.id}`, 409, { role: 'CONTENT_EDITOR', method: 'PATCH', body: { revision: 1, slug: 'synthetic-step8-projects' } });
    await unchanged(projects, duplicateTarget.id, duplicateBefore);

    const rollback = (await req('/admin/projects', 201, { role: 'CONTENT_EDITOR', method: 'POST', body: { ...minimal('projects', '-rollback'), ...fields('projects') } })).data;
    const rollbackPath = `/admin/projects/${rollback.id}`;
    const before = await snapshot(projects, rollback.id);
    const beforeCount = await projects.countDocuments({});
    await connection.db.command({ collMod: 'content_audits', validator: { $expr: { $eq: [1, 0] } }, validationLevel: 'strict' });
    try {
      await req('/admin/projects', 503, { role: 'CONTENT_EDITOR', method: 'POST', body: minimal('projects', '-rollback-create') });
      assert.equal(await projects.countDocuments({}), beforeCount);
      assert.equal(await projects.countDocuments({ slug: 'synthetic-step8-projects-rollback-create' }), 0);
      await unchanged(projects, rollback.id, before);
      await req(rollbackPath, 503, { role: 'CONTENT_EDITOR', method: 'PATCH', body: { revision: 1, summary: 'Synthetic failed transactional update' } });
      await unchanged(projects, rollback.id, before);
      await req(rollbackPath + '/publish', 503, { role: 'SUPER_ADMIN', method: 'POST', body: { revision: 1 } });
      await unchanged(projects, rollback.id, before); await req(`/projects/${rollback.slug}`, 404);
    } finally { await connection.db.command({ collMod: 'content_audits', validator: {}, validationLevel: 'strict' }); }
    const recovered = (await req(rollbackPath + '/publish', 200, { role: 'SUPER_ADMIN', method: 'POST', body: { revision: 1 } })).data;
    await checkAudit('projects', 'publish', 'SUPER_ADMIN', recovered);
    await req(`/projects/${rollback.slug}`, 200);
    for (const kind of Object.keys(contentDefinitions)) {
      const list = await req(`/${kind}`, 200);
      assert.ok(list.data.every(record => !('revision' in record) && !('status' in record)));
    }
    const ready = await fetch(base + '/health/ready'); assert.equal(ready.status, 200); assert.deepEqual(await ready.json(), { status: 'ok' });
    console.log('PASS: scheduling, legacy revisions, duplicate-update rollback, PATCH CORS and actual create/edit/publish transaction rollback after audit-write rejection');
  } finally {
    if (owned) await connection.dropDatabase(); await connection.close();
    if (owned) console.log('CLEANUP: isolated Step 8 synthetic database removed');
  }
});
