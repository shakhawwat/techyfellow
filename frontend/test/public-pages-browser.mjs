// Real isolated MongoDB/API/production Next.js + Chrome. No API mocks or public company data.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const { chromium } = await import(process.env.TECHYFELLOW_PLAYWRIGHT_MODULE ?? 'playwright');
const fixture = JSON.parse(fs.readFileSync(process.env.TECHYFELLOW_UI_FIXTURES, 'utf8'));
const base = 'http://localhost:12083', canonicalOrigin = 'https://techyfellow.example.invalid';
const flags = ['compose', '-p', 'techyfellow-step12-check', '-f', 'docker-compose.yml', '-f', 'docker-compose.dev.yml', '-f', 'docker-compose.step12.local.yml'];
function compose(args, input) { return execFileSync('docker', [...flags, ...args], { cwd: new URL('../../', import.meta.url), input, stdio: ['pipe', 'pipe', 'pipe'] }); }
const browser = await chromium.launch({ executablePath: process.env.TECHYFELLOW_CHROME_PATH ?? '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
const context = await browser.newContext(), page = await context.newPage(); page.setDefaultTimeout(15000);
const pass = value => console.log('PASS: ' + value), kinds = ['projects', 'research', 'publications'];
async function ready() { for (let i = 0; i < 30; i++) { try { if ((await context.request.get(base + '/', { timeout: 4000 })).status() === 200) return; } catch {} await new Promise(r => setTimeout(r, 1000)); } throw Error('Owned frontend failed to recover'); }
async function noOverflow() { assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)); }
try {
  if (process.env.TECHYFELLOW_UI_PHASE !== 'layout') {
  for (const kind of kinds) {
    const api = await context.request.get(`${base}/api/v1/${kind}?page=1&limit=20`); assert.equal(api.status(), 200); const json = await api.json(); assert.equal(json.pagination.total, 23); assert.equal(json.data.length, 20);
    await page.goto(`${base}/${kind}`); await page.getByRole('heading', { name: kind[0].toUpperCase() + kind.slice(1), exact: true }).waitFor();
    assert.match(await page.locator('.content-result-count').innerText(), /^23 published/);
    assert.equal(await page.locator(kind === 'publications' ? '.publication-entry' : '.content-grid .content-record').count(), 20);
    const html = await (await context.request.get(`${base}/${kind}`)).text(); assert.ok(html.includes(`Synthetic ${kind} published fixture`)); for (const state of ['draft', 'archived', 'future']) assert.ok(!html.includes(`Synthetic ${kind} ${state} fixture`));
    await page.getByRole('link', { name: 'Next page', exact: true }).click(); await page.waitForURL(/page=2/); await page.getByText('Page 2 of 2', { exact: true }).waitFor();
    assert.equal(await page.locator(kind === 'publications' ? '.publication-entry' : '.content-grid .content-record').count(), 3);
    await page.getByRole('link', { name: 'Previous page', exact: true }).click(); await page.waitForURL(/page=1/);
    const fields = { projects: { category: 'Synthetic category', technology: 'Synthetic tool' }, research: { domain: 'Synthetic domain', researchStage: 'active' }, publications: { author: 'Synthetic Author', venue: 'Synthetic venue', year: '2026' } }[kind];
    for (const [key, value] of Object.entries(fields)) { if (key === 'researchStage') await page.locator('#' + key).selectOption(value); else await page.locator('#' + key).fill(value); }
    await page.locator('#limit').fill('1'); await page.locator('#sort').selectOption(kind === 'publications' ? '-year' : 'title'); await page.getByRole('button', { name: 'Apply filters', exact: true }).click(); await page.getByText('1 published record match this selection.', { exact: true }).waitFor();
    const selection = new URL(page.url()); for (const [key, value] of Object.entries(fields)) assert.equal(selection.searchParams.get(key), value);
    assert.match(await page.locator('link[rel=canonical]').getAttribute('href'), new RegExp(`^${canonicalOrigin}/${kind}\\?page=1&limit=1&sort=`));
    const detail = await page.goto(`${base}/${kind}/synthetic-${kind}-published`); assert.equal(detail.status(), 200);
    await page.getByRole('heading', { name: `Synthetic ${kind} published fixture`, exact: true }).waitFor();
    assert.equal(await page.locator('nav[aria-label=Breadcrumb] [aria-current=page]').innerText(), `Synthetic ${kind} published fixture`);
    const canonical = await page.locator('link[rel=canonical]').getAttribute('href'); assert.equal(canonical, kind === 'publications' ? 'https://canonical.example.invalid/publications/synthetic-publications-published' : `${canonicalOrigin}/${kind}/synthetic-${kind}-published`);
    const schemas = await page.locator('script[type="application/ld+json"]').evaluateAll(nodes => nodes.map(node => JSON.parse(node.textContent))); assert.equal(schemas.length, 2); assert.equal(schemas[0].name, `Synthetic ${kind} published fixture`); assert.equal(schemas[1]['@type'], 'BreadcrumbList');
    if (kind === 'projects') { for (const heading of ['Problem', 'Approach', 'Technologies', 'Documented results']) await page.getByRole('heading', { name: heading, exact: true }).waitFor(); assert.ok((await page.locator('.content-reading').innerText()).includes('<script>window.syntheticUnsafe=true</script>')); assert.equal(await page.evaluate(() => window.syntheticUnsafe), undefined); }
    if (kind === 'research') { await page.getByText('Synthetic method', { exact: true }).waitFor(); await page.getByText('Synthetic Contributor', { exact: true }).waitFor(); await page.getByText('Research stage: active', { exact: true }).waitFor(); }
    if (kind === 'publications') { assert.equal(await page.title(), 'Synthetic publication SEO | Techy Fellow'); assert.equal(await page.locator('meta[name=description]').getAttribute('content'), 'Synthetic publication SEO description.'); assert.equal(await page.getByRole('link', { name: 'Open DOI record' }).getAttribute('href'), 'https://doi.org/10.1234/synthetic-verification'); assert.equal(await page.getByRole('link', { name: 'Open publisher page' }).getAttribute('href'), 'https://publisher.example.invalid/synthetic'); }
    for (const status of ['missing', 'draft', 'archived', 'future']) {
      const response = await context.request.get(`${base}/${kind}/synthetic-${kind}-${status}`, { headers: { 'User-Agent': 'Mozilla/5.0' } }); assert.equal(response.status(), 404, `${kind}/${status} must be a genuine HTTP 404`); assert.ok((await response.text()).includes('Published content not found'));
    }
    const invalid = await page.goto(`${base}/${kind}?page=0`); assert.equal(invalid.status(), 200); await page.getByRole('heading', { name: 'Check your filters', exact: true }).waitFor(); assert.ok((await page.locator('meta[name=robots]').getAttribute('content')).includes('noindex'));
    await page.goto(`${base}/${kind}?${kind === 'projects' ? 'category' : kind === 'research' ? 'domain' : 'venue'}=Synthetic-no-match`); await page.getByText(/No (published projects|published research|publications) match(es)? this selection\./).waitFor();
  }
  pass('real SSR lists/pagination/all supported filters; valid details; draft/archived/future/missing HTTP 404s');
  pass('metadata/canonical fallback and published SEO; safe escaped technical text; DOI/publisher protocols and actual-field structured data');
  }
  await page.goto(base + '/'); const hrefs = await page.locator('a[href]').evaluateAll(nodes => nodes.map(n => n.getAttribute('href')));
  for (const href of hrefs) { const url = new URL(href, base); assert.equal(url.origin, base); if (url.pathname === '/') { if (url.hash) assert.equal(await page.locator(`[id="${url.hash.slice(1)}"]`).count(), 1); } else { assert.match(url.pathname, /^\/((projects|research|publications)(\/synthetic-[a-z0-9-]+)?|solutions|consulting|institutional|about|academy(\/courses(\/synthetic-[a-z0-9-]+)?)?|team(\/synthetic-[a-z0-9-]+)?)$/); assert.equal((await context.request.get(url.href)).status(), 200); } }
  for (const kind of kinds) assert.ok(hrefs.includes(`/${kind}/synthetic-${kind}-published`));
  await page.goto(base + '/admin'); await page.waitForURL(base + '/admin/login'); assert.equal(await page.getByRole('heading', { name: 'Choose a collection', exact: true }).count(), 0); assert.equal((await context.request.get(base + '/api/v1/auth/me')).status(), 401); assert.equal(await page.locator('.site-header').count(), 0);
  pass('homepage preview/list links resolve; anonymous admin gate/session behavior preserved');
  for (const route of ['/projects/synthetic-projects-published', '/research/synthetic-research-published', '/publications', '/publications/synthetic-publications-published']) {
    await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto(base + route); await noOverflow();
    await page.screenshot({ path: `${process.env.TECHYFELLOW_UI_ARTIFACTS}/${route.split('/')[1]}-${route.includes('/synthetic') ? 'detail' : 'list'}-desktop.png`, fullPage: true });
    for (const width of [320, 390, 768]) { await page.setViewportSize({ width, height: 844 }); await noOverflow(); }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: `${process.env.TECHYFELLOW_UI_ARTIFACTS}/${route.split('/')[1]}-${route.includes('/synthetic') ? 'detail' : 'list'}-mobile.png`, fullPage: true });
  }
  await page.goto(base + '/projects'); await page.keyboard.press('Tab'); assert.equal(await page.locator(':focus').innerText(), 'Skip to content'); await page.keyboard.press('Enter'); assert.equal(await page.locator(':focus').getAttribute('id'), 'public-main');
  await page.getByRole('button', { name: 'Open navigation menu' }).click(); await page.keyboard.press('Escape'); assert.equal(await page.locator(':focus').getAttribute('aria-label'), 'Open navigation menu');
  await page.locator('#category').focus(); await page.keyboard.press('Tab'); assert.equal(await page.locator(':focus').getAttribute('id'), 'technology');
  await page.emulateMedia({ reducedMotion: 'reduce' }); assert.equal(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), true);
  pass('desktop/mobile 320/390/768/1440 layouts; skip link/form keyboard/menu Escape focus/reduced motion');
  compose(['exec', '-T', 'backend', 'node', 'test/public-pages-fixtures.mjs', 'empty'], JSON.stringify(fixture)); compose(['restart', 'frontend']); await ready();
  for (const kind of kinds) { await page.goto(`${base}/${kind}`); await page.getByText(/No (published projects|published research|publications) match(es)? this selection\./).waitFor(); assert.equal(await page.locator('.content-record,.publication-entry').count(), 0); }
  pass('actual empty collections show honest empty states without synthetic fallback');
  compose(['stop', 'backend']); compose(['restart', 'frontend']); await ready();
  for (const kind of kinds) for (const suffix of ['', `/synthetic-${kind}-published`]) {
    const response = await page.goto(`${base}/${kind}${suffix}`); assert.equal(response.status(), 200); await page.getByText('Content is temporarily unavailable. Please try again later. This does not mean the requested record is missing.', { exact: true }).waitFor();
    assert.equal(await page.locator('link[rel=canonical]').count(), 0); assert.ok((await page.locator('meta[name=robots]').getAttribute('content')).includes('noindex'));
    const text = await page.locator('main').innerText(); assert.ok(!text.includes('backend:4000')); assert.ok(!text.includes('Synthetic')); assert.ok(!text.includes('Published content not found'));
  }
  pass('real backend outage stays distinct from 404; safe unavailable/noindex states, no stale/mock records');
} finally { compose(['start', 'backend']); await browser.close(); }
