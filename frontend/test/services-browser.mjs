// Real production frontend + existing backend + isolated synthetic MongoDB, with Chrome. No API mocks.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const { chromium } = await import(process.env.TECHYFELLOW_PLAYWRIGHT_MODULE ?? 'playwright');
const fixture = JSON.parse(fs.readFileSync(process.env.TECHYFELLOW_UI_FIXTURES, 'utf8'));
const base = 'http://localhost:12084', origin = 'https://techyfellow.example.invalid';
const flags = ['compose', '-p', 'techyfellow-step13-check', '-f', 'docker-compose.yml', '-f', 'docker-compose.dev.yml', '-f', 'docker-compose.step13.local.yml'];
function compose(args) { return execFileSync('docker', [...flags, ...args], { cwd: new URL('../../', import.meta.url), stdio: 'pipe' }); }
const browser = await chromium.launch({ executablePath: process.env.TECHYFELLOW_CHROME_PATH ?? '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
const context = await browser.newContext(), page = await context.newPage(); page.setDefaultTimeout(15000);
const groups = {
  solutions: { title: 'Solutions', items: { robotics: 'Robotics engineering', 'iot-embedded': 'IoT & embedded systems', 'ai-vision': 'AI & vision', automation: 'Automation', prototyping: 'Prototyping' } },
  consulting: { title: 'Consulting', items: { capstone: 'Capstone mentorship', research: 'Research implementation consulting', startup: 'Startup engineering consulting' } },
  institutional: { title: 'Institutional services', items: { schools: 'Schools', universities: 'Universities', industry: 'Industry' } },
};
const links = new Set(), pass = message => console.log('PASS: ' + message);
async function ready() { for (let i = 0; i < 30; i++) { try { if ((await context.request.get(base + '/solutions', { timeout: 4000 })).status() === 200) return; } catch {} await new Promise(resolve => setTimeout(resolve, 1000)); } throw Error('Owned frontend failed to recover'); }
try {
  for (const [group, definition] of Object.entries(groups)) {
    for (const [slug, title] of [['', definition.title], ...Object.entries(definition.items)]) {
      const path = `/${group}${slug ? '/' + slug : ''}`, response = await page.goto(base + path);
      assert.equal(response.status(), 200, path); await page.getByRole('heading', { name: title, exact: true, level: 1 }).waitFor();
      assert.equal(await page.title(), title + ' | Techy Fellow'); assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'), origin + path);
      assert.ok((await page.locator('meta[name=description]').getAttribute('content')).length > 20);
      assert.equal(await page.locator('nav[aria-label=Breadcrumb] [aria-current=page]').innerText(), title);
      const data = JSON.parse(await page.locator('script[type="application/ld+json"]').innerText()); assert.equal(data['@type'], 'BreadcrumbList'); assert.equal(data.itemListElement.at(-1).item, origin + path); assert.equal(data.itemListElement.length, slug ? 3 : 2);
      assert.equal(await page.locator('main form').count(), 0); assert.equal(await page.getByRole('heading', { name: 'Related published work', exact: true }).count(), 0); assert.ok(!(await page.locator('main').innerText()).includes('Synthetic Robotics'));
      assert.ok((await page.locator('.service-scope-note').innerText()).includes('proposed scopes for discussion'));
      if (slug) { for (const heading of ['Proposed deliverables', 'Client responsibilities', 'Proposed process']) await page.getByRole('heading', { name: heading, exact: true }).waitFor(); }
      for (const href of await page.locator('a[href]').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')))) links.add(href);
      for (const width of [320, 390, 768, 1440]) { await page.setViewportSize({ width, height: 900 }); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), path + ' overflow at ' + width); }
    }
    for (const slug of ['unknown-service', '__proto__', 'ROBOTICS']) {
      const response = await context.request.get(`${base}/${group}/${slug}`, { headers: { 'User-Agent': 'Mozilla/5.0' } }); assert.equal(response.status(), 404, group + '/' + slug); assert.ok((await response.text()).includes('Pathway not found'));
    }
  }
  pass('all 14 proposed-service routes render; accurate metadata/canonical/breadcrumbs; no fake forms or inferred related work; genuine unknown-slug 404s');
  for (const href of links) { const url = new URL(href, base); assert.equal(url.origin, base); const response = await context.request.get(url.origin + url.pathname + url.search); assert.equal(response.status(), 200, href); if (url.hash) assert.ok((await response.text()).includes(`id="${url.hash.slice(1)}"`), href); }
  await page.goto(base + '/'); assert.equal(await page.locator('.desktop-nav').getByRole('link', { name: 'Solutions', exact: true }).getAttribute('href'), '/solutions'); assert.equal(await page.locator('.desktop-nav').getByRole('link', { name: 'Consulting', exact: true }).getAttribute('href'), '/consulting'); assert.equal(await page.locator('.desktop-nav').getByRole('link', { name: 'Research', exact: true }).getAttribute('href'), '/research');
  assert.equal(await page.getByRole('link', { name: 'Institutional inquiries', exact: true }).getAttribute('href'), '/institutional');
  await page.goto(base + '/solutions'); await page.getByRole('link', { name: 'Explore institutional pathways', exact: true }).click(); await page.waitForURL(base + '/institutional');
  await page.goto(base + '/consulting/capstone'); await page.getByRole('heading', { name: 'Academic responsibility', exact: true }).waitFor(); assert.ok((await page.locator('.service-integrity').innerText()).includes('Students remain responsible for their assessed academic work.'));
  await page.getByRole('link', { name: 'View inquiry information', exact: true }).first().click(); await page.waitForURL(base + '/#inquiry'); await page.getByText('Inquiry submission is not available yet. Confirmed contact channels will be published here.', { exact: true }).waitFor();
  pass('all navigation/breadcrumb/CTA destinations resolve; institution discovery and capstone academic responsibility explicit');
  await page.goto(base + '/solutions/robotics'); await page.keyboard.press('Tab'); assert.equal(await page.locator(':focus').innerText(), 'Skip to content'); await page.keyboard.press('Enter'); assert.equal(await page.locator(':focus').getAttribute('id'), 'public-main');
  const summary = page.locator('.service-faq summary').first(); await summary.focus(); assert.equal(await page.locator(':focus').evaluate(node => getComputedStyle(node).outlineStyle), 'solid'); await page.keyboard.press('Enter'); assert.equal(await page.locator('.service-faq details').first().getAttribute('open'), ''); await page.keyboard.press('Enter'); assert.equal(await page.locator('.service-faq details').first().getAttribute('open'), null);
  await page.setViewportSize({ width: 390, height: 844 }); await page.getByRole('button', { name: 'Open navigation menu' }).click(); await page.keyboard.press('Shift+Tab'); assert.equal(await page.locator('dialog :focus').innerText(), 'Build With Us'); await page.keyboard.press('Escape'); assert.equal(await page.locator(':focus').getAttribute('aria-label'), 'Open navigation menu');
  await page.getByRole('button', { name: 'Open navigation menu' }).click(); await page.locator('dialog').getByRole('link', { name: 'Consulting', exact: true }).click(); await page.waitForURL(base + '/consulting'); assert.equal(await page.locator('dialog[open]').count(), 0);
  await page.emulateMedia({ reducedMotion: 'reduce' }); assert.equal(await page.locator('.service-hero-actions .button').evaluate(node => getComputedStyle(node).transitionDuration), '0s');
  for (const path of ['/solutions', '/solutions/robotics', '/consulting/capstone', '/institutional/universities']) for (const [label, width] of [['desktop', 1440], ['mobile', 390]]) {
    await page.setViewportSize({ width, height: label === 'desktop' ? 1000 : 844 }); await page.goto(base + path);
    await page.screenshot({ path: `${process.env.TECHYFELLOW_UI_ARTIFACTS}/${path.slice(1).replaceAll('/', '-')}-${label}.png`, fullPage: true });
  }
  pass('all route widths 320/390/768/1440 without overflow; keyboard skip/focus/FAQ, mobile menu containment/Escape/navigation, reduced motion; screenshots captured');
  for (const kind of ['projects', 'research', 'publications']) {
    await page.goto(`${base}/${kind}`); await page.getByRole('link', { name: `Synthetic Robotics ${kind} published`, exact: true }).click(); await page.waitForURL(`${base}/${kind}/synthetic-${kind}-published`); await page.getByRole('heading', { name: `Synthetic Robotics ${kind} published`, exact: true }).waitFor(); assert.equal((await context.request.get(`${base}/${kind}/synthetic-${kind}-draft`)).status(), 404);
  }
  await page.goto(base + '/admin'); await page.waitForURL(base + '/admin/login'); assert.equal(await page.locator('.site-header').count(), 0);
  await page.getByLabel('Email', { exact: false }).fill(fixture.email); await page.getByLabel('Password', { exact: false }).fill(fixture.password); await page.getByRole('button', { name: 'Sign in', exact: true }).click(); await page.waitForURL(base + '/admin'); await page.getByRole('heading', { name: 'Choose a collection', exact: true }).waitFor();
  await page.reload(); await page.getByRole('heading', { name: 'Choose a collection', exact: true }).waitFor(); await page.goto(base + '/admin/projects'); await page.getByRole('link', { name: 'Synthetic Robotics projects published', exact: false }).waitFor();
  await page.goto(base + '/solutions/robotics'); assert.ok(!(await page.locator('body').innerText()).includes(fixture.email)); assert.equal(await page.getByRole('button', { name: 'Log out', exact: true }).count(), 0);
  await page.goto(base + '/admin'); await page.getByRole('button', { name: 'Log out', exact: true }).click(); await page.waitForURL(base + '/admin/login'); assert.equal((await context.request.get(base + '/api/v1/auth/me')).status(), 401);
  pass('existing published lists/details/draft exclusion; real admin login/restoration/content list/public-layout separation/logout');
  compose(['stop', 'backend']); compose(['restart', 'frontend']); await ready();
  await page.goto(base + '/solutions/robotics'); await page.getByRole('heading', { name: 'Robotics engineering', exact: true, level: 1 }).waitFor(); assert.equal(await page.getByRole('heading', { name: 'Related published work', exact: true }).count(), 0); assert.ok(!(await page.locator('main').innerText()).includes('Synthetic')); assert.equal((await context.request.get(base + '/consulting/unknown-service')).status(), 404);
  pass('proposed scopes and unknown-slug 404s remain available during API outage; no empty/mock related section');
} finally { compose(['start', 'backend']); await browser.close(); }
