// Explicit simulated fetch/clock tests; runtime verification uses real APIs separately.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url), ts = require('typescript'), env = {};
function compile(file, dependencies = {}) {
  const m = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL(file, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
    { module: m, exports: m.exports, require: name => dependencies[name], URL, URLSearchParams, Map, Set, Number, Date, AbortSignal, fetch, process: { env } });
  return m.exports;
}
const content = compile('../src/lib/public/content.ts');
const { parseListQuery, listHref, safeHttps, siteOrigin, canonicalUrl, doiUrl, decodeRecord, createPagesLoader, approvedImage } = compile('../src/lib/public/pages.ts', { './content': content });
const now = Date.parse('2026-10-07T00:00:00Z');
const project = { slug: 'synthetic-project', title: 'Synthetic engineering fixture', summary: 'Explicit synthetic content.', publishedAt: '2026-01-01T00:00:00Z', category: 'Synthetic category', problem: '<script>synthetic text</script>', approach: 'Synthetic approach.', technologies: ['Synthetic tool'], results: ['Synthetic result'] };
const research = { ...project, domain: 'Synthetic domain', researchStage: 'active', methods: ['Synthetic method'], contributors: [{ name: 'Synthetic Person', private: 'hidden' }] };
const publication = { ...project, authors: ['Synthetic Author'], venue: 'Synthetic venue', year: 2026, doi: '10.1234/synthetic-example', publisherUrl: 'https://publisher.example.invalid/synthetic' };
test('queries allow only supported filters, safe pagination/sort and retain all selection in page links', () => {
  for (const [kind, selection] of [['projects', { category: 'Synthetic category', technology: 'Synthetic tool' }], ['research', { domain: 'Synthetic domain', researchStage: 'active' }], ['publications', { author: 'Synthetic Author', venue: 'Synthetic venue', year: '2026' }]]) {
    const query = parseListQuery(kind, { ...selection, page: '2', limit: '1', sort: 'title' });
    const url = new URL(listHref(kind, query, 3), 'https://example.invalid');
    for (const [key, value] of Object.entries(selection)) assert.equal(url.searchParams.get(key), value);
    assert.equal(url.searchParams.get('page'), '3'); assert.equal(url.searchParams.get('limit'), '1');
  }
  for (const query of [{ page: '0' }, { page: '01' }, { page: '-1' }, { limit: '101' }, { page: '9007199254740991', limit: '100' }, { sort: '__v' }, { category: ['a', 'b'] }, { category: ' bad' }, { category: 'bad\n' }, { status: 'draft' }, { 'category[$ne]': 'a' }]) assert.throws(() => parseListQuery('projects', query));
  assert.throws(() => parseListQuery('research', { researchStage: 'published' }));
  assert.throws(() => parseListQuery('publications', { year: '10000' }));
});
test('record projection rejects explicit unpublished/future data and unsafe source URLs', () => {
  for (const record of [{ ...project, status: 'draft' }, { ...project, status: 'archived' }, { ...project, publishedAt: '2099-01-01T00:00:00Z' }]) assert.throws(() => decodeRecord(record, 'projects', now));
  const decoded = decodeRecord({ ...research, passwordHash: 'private', seo: { title: 'Synthetic SEO', canonicalUrl: 'javascript:alert(1)' } }, 'research', now);
  assert.equal(decoded.passwordHash, undefined); assert.equal(decoded.contributors[0].private, undefined); assert.equal(decoded.seo.canonicalUrl, undefined);
  for (const url of ['javascript:alert(1)', 'data:text/html,test', 'http://example.invalid', 'https://user:password@example.invalid', 'https://example.invalid/\n']) assert.equal(safeHttps(url), undefined);
  assert.equal(siteOrigin('https://example.invalid/path'), undefined); assert.equal(siteOrigin('https://example.invalid'), 'https://example.invalid');
  assert.equal(canonicalUrl('/projects/synthetic-project', 'https://example.invalid'), 'https://example.invalid/projects/synthetic-project');
  assert.equal(doiUrl('javascript:alert(1)'), undefined); assert.match(doiUrl(publication.doi), /^https:\/\/doi.org\/10.1234\//);
  assert.equal(decodeRecord({ ...publication, publisherUrl: 'javascript:alert(1)' }, 'publications', now).publisherUrl, undefined);
});
test('404 is distinct from outage; misses/errors uncached; snapshots expire without stale fallback', async () => {
  let clock = now, status = 200, calls = 0;
  const loader = createPagesLoader('http://backend:4000/api/v1', async (url, options) => {
    calls++; assert.equal(options.credentials, 'omit'); assert.equal(options.cache, 'no-store'); assert.equal(options.headers, undefined); assert.equal(options.redirect, 'error');
    assert.match(url, /\/projects\/synthetic-project$/);
    return { ok: status === 200, status, json: async () => ({ data: project }) };
  }, () => clock);
  const [a, b] = await Promise.all([loader.detail('projects', project.slug), loader.detail('projects', project.slug)]);
  assert.equal(a, b); assert.equal(calls, 1); assert.equal(a.state, 'available');
  clock += content.CONTENT_TTL_MS + 1; status = 503; assert.equal((await loader.detail('projects', project.slug)).state, 'unavailable');
  status = 404; assert.equal((await loader.detail('projects', project.slug)).state, 'missing');
  status = 200; assert.equal((await loader.detail('projects', project.slug)).state, 'available');
  assert.equal((await loader.detail('projects', '../auth/me')).state, 'missing'); assert.equal(calls, 4);
});
test('pagination DTOs verified; cache capacity evicts old queries', async () => {
  let calls = 0, malformed = false;
  const loader = createPagesLoader('http://backend:4000/api/v1', async url => {
    calls++; const q = new URL(url).searchParams;
    return { ok: true, status: 200, json: async () => ({ data: [], pagination: { page: Number(q.get('page')), limit: 20, total: 0, totalPages: malformed ? 1 : 0 } }) };
  }, () => now);
  for (let i = 1; i <= 129; i++) assert.equal((await loader.list('projects', parseListQuery('projects', { page: String(i) }))).state, 'available');
  await loader.list('projects', parseListQuery('projects', {})); assert.equal(calls, 130);
  malformed = true; assert.equal((await loader.list('projects', parseListQuery('projects', { page: '130' }))).state, 'unavailable');
});

test('approved images require exact configured HTTPS host, randomized path and decoded dimensions', () => {
  const path = '/techyfellow/media/' + 'a'.repeat(32) + '.webp';
  assert.equal(approvedImage('https://media.example.invalid' + path), false);
  env.NEXT_PUBLIC_MEDIA_HOST = 'media.example.invalid';
  assert.equal(approvedImage('https://media.example.invalid' + path), true);
  for (const url of ['http://media.example.invalid' + path, 'https://other.example.invalid' + path, 'https://media.example.invalid' + path + '?token=test', 'https://media.example.invalid/unknown.webp', 'https://media.example.invalid' + path.replace('.webp', '.svg')]) assert.equal(approvedImage(url), false);
  const decoded = decodeRecord({ ...project, media: [{ type: 'image', url: 'https://media.example.invalid' + path, altText: 'Synthetic test image', width: 400, height: 300 }, { type: 'image', url: 'https://media.example.invalid' + path, altText: 'Synthetic invalid dimensions', width: 0, height: 300 }] }, 'projects', now);
  assert.equal(decoded.media.length, 1);
  delete env.NEXT_PUBLIC_MEDIA_HOST;
});

test('course/team queries use their API allowlists and public route paths', () => {
  const courses = parseListQuery('courses', { level: 'beginner', deliveryMode: 'live-online', page: '2', limit: '1', sort: 'title' });
  const url = new URL(listHref('courses', courses, 3), 'https://example.invalid'); assert.equal(url.pathname, '/academy/courses'); assert.equal(url.searchParams.get('page'), '3'); assert.equal(url.searchParams.get('level'), 'beginner');
  const team = parseListQuery('team', { expertise: 'Synthetic expertise', sort: '-name' }); assert.match(listHref('team', team), /^\/team\?/);
  for (const query of [{ level: 'expert' }, { deliveryMode: 'scheduled' }, { price: '10' }, { level: ['beginner', 'advanced'] }]) assert.throws(() => parseListQuery('courses', query));
  assert.throws(() => parseListQuery('team', { sort: 'title' }));
});
test('course DTOs validate curriculum/duration while excluding unsupported enrollment facts', () => {
  const course = { slug: 'synthetic-course', title: 'Synthetic course', summary: 'Clearly synthetic.', publishedAt: project.publishedAt, level: 'beginner', deliveryMode: 'live-online', duration: { value: 6, unit: 'weeks' }, prerequisites: ['Synthetic prerequisite'], syllabus: [{ title: 'Synthetic module', topics: ['Synthetic topic'] }], instructor: 'Unverified Instructor', price: 100, cohortDates: ['2099-01-01'], hardwareRequirements: ['Unverified hardware'], certification: true };
  const result = decodeRecord(course, 'courses', now); assert.equal(result.duration.value, 6); assert.equal(result.syllabus[0].topics[0], 'Synthetic topic');
  for (const property of ['instructor', 'price', 'cohortDates', 'hardwareRequirements', 'certification']) assert.equal(result[property], undefined);
  for (const mutation of [{ duration: { value: 0, unit: 'hours' } }, { duration: { value: Infinity, unit: 'hours' } }, { duration: { value: 1, unit: 'months' } }, { syllabus: [{ title: null }] }, { status: 'draft' }, { publishedAt: '2099-01-01T00:00:00Z' }]) assert.throws(() => decodeRecord({ ...course, ...mutation }, 'courses', now));
});
test('team DTOs preserve approved public data, filter unsafe links and ignore unsupported photos', () => {
  const member = { slug: 'synthetic-person', name: 'Synthetic Person', summary: 'Synthetic profile.', publishedAt: project.publishedAt, biography: '<script>synthetic plain biography</script>', expertise: ['Synthetic expertise'], profileLinks: [{ label: 'Approved published link', url: 'https://profile.example.invalid/approved' }, { label: 'Explicitly unapproved', url: 'https://profile.example.invalid/unapproved', approved: false }, { label: 'Unsafe', url: 'javascript:alert(1)' }, { label: 'Credentials', url: 'https://user:secret@profile.example.invalid' }, null], image: 'https://unapproved.example.invalid/photo.png', media: [{ type: 'image', url: 'https://unapproved.example.invalid/photo.png', altText: 'Unapproved test photo', width: 400, height: 300 }], passwordHash: 'private' };
  const result = decodeRecord(member, 'team', now); assert.equal(result.title, 'Synthetic Person'); assert.equal(result.biography, member.biography); assert.equal(result.profileLinks.length, 1); assert.equal(result.media, undefined); assert.equal(result.image, undefined); assert.equal(result.passwordHash, undefined);
  for (const mutation of [{ biography: undefined }, { status: 'draft' }, { status: 'archived' }, { publishedAt: '2099-01-01T00:00:00Z' }]) assert.throws(() => decodeRecord({ ...member, ...mutation }, 'team', now));
});
