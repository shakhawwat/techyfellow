import assert from 'node:assert/strict';
const { chromium } = await import(process.env.TECHYFELLOW_PLAYWRIGHT_MODULE ?? 'playwright');
const base = process.env.TECHYFELLOW_NAVBAR_URL ?? 'http://localhost:8081';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
try {
const page=await browser.newPage({viewport:{width:1440,height:900}});
await page.goto(base);
const nav=page.getByRole('navigation',{name:'Main navigation',exact:true}), s=nav.getByRole('button',{name:'Solutions',exact:true}), r=nav.getByRole('button',{name:'Research',exact:true});
await page.getByRole('heading', { level: 1 }).click(); const focus=await page.evaluate(()=>document.activeElement.tagName);
await s.hover(); await page.waitForTimeout(160); assert.equal(await s.getAttribute('aria-expanded'),'true'); assert.equal(await page.evaluate(()=>document.activeElement.tagName),focus);
const b=await s.boundingBox(); await page.mouse.move(b.x+b.width/2,b.y+b.height+6); await page.waitForTimeout(260); assert.equal(await s.getAttribute('aria-expanded'),'true');
await page.locator('#public-desktop-solutions li a').first().hover(); await page.waitForTimeout(260); assert.equal(await s.getAttribute('aria-expanded'),'true');
await r.hover(); await page.waitForTimeout(160); assert.equal(await r.getAttribute('aria-expanded'),'true'); assert.equal(await s.getAttribute('aria-expanded'),'false');
await s.hover(); await page.waitForTimeout(30); await r.hover(); await page.waitForTimeout(160); assert.equal(await nav.locator('button[aria-expanded="true"]').count(),1); assert.equal(await r.getAttribute('aria-expanded'),'true');
await page.mouse.move(10,400); await page.waitForTimeout(260); assert.equal(await r.getAttribute('aria-expanded'),'false');
await s.hover(); await page.waitForTimeout(30); await page.getByRole('heading', { level: 1 }).click(); await page.waitForTimeout(160); assert.equal(await s.getAttribute('aria-expanded'),'false');
await s.focus(); await page.keyboard.press('ArrowDown'); await page.locator('#public-desktop-solutions a').first().waitFor(); await page.keyboard.press('End'); assert.equal(await page.locator(':focus').innerText(),'Institutional'); await page.keyboard.press('Escape'); assert.equal(await s.getAttribute('aria-expanded'),'false');
await s.click(); assert.equal(await s.getAttribute('aria-expanded'),'true'); await s.click(); await page.waitForTimeout(160); assert.equal(await s.getAttribute('aria-expanded'),'false');
await page.emulateMedia({reducedMotion:'reduce'}); assert.equal(await s.evaluate(el=>getComputedStyle(el,'::after').transitionDuration),'0s');
const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}); const m=await mobile.newPage(); await m.goto(base); await m.getByRole('button',{name:'Open navigation menu'}).tap(); const d=m.getByRole('dialog'), ms=d.getByRole('button',{name:'Solutions',exact:true}); await ms.tap(); await m.waitForTimeout(300); assert.equal(await ms.getAttribute('aria-expanded'),'true'); assert.equal(await m.evaluate(()=>document.body.style.overflow),'hidden'); await ms.tap(); assert.equal(await ms.getAttribute('aria-expanded'),'false'); await d.getByRole('button',{name:'Close navigation menu'}).tap(); assert.notEqual(await m.evaluate(()=>document.body.style.overflow),'hidden');
console.log('PASS: hover delay/bridge/no focus theft, rapid switching, close delay, pending cancellation, click, keyboard/Escape, reduced motion, touch expansion and scroll unlock');
} finally {await browser.close();}
