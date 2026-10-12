// Run against the locally built checkout, with existing verified demo data.
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.TECHYFELLOW_PLAYWRIGHT_MODULE ?? 'playwright');
const browser = await chromium.launch({executablePath:process.env.TECHYFELLOW_CHROME_PATH??'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
const base=process.env.TECHYFELLOW_DETAIL_BASE??'http://localhost:13000';
const context=await browser.newContext(),page=await context.newPage();
const slug='academy-demo-robotics-iot';
try {
 for(const width of [1440,768,390]) {
  await page.setViewportSize({width,height:1000});
  const response=await page.goto(`${base}/academy/courses/${slug}`);assert.equal(response.status(),200);
  await page.getByRole('heading',{name:'Robotics & IoT Foundations',exact:true}).waitFor();
  const price=page.getByRole('main').locator(`[data-academy-price="${slug}"]`);assert.equal(await price.getAttribute('data-price-minor'),'149000');assert.ok(await price.getByText('Illustrative course material · Purchase unavailable',{exact:true}).isVisible());assert.ok(await price.getByText('40% off',{exact:true}).isVisible());
  assert.ok(await page.getByRole('main').getByText('Illustrative course previews — not scheduled programs or open enrollment.',{exact:true}).isVisible());
  const panel=page.getByRole('complementary',{name:'Course price and access'});
  assert.equal(await panel.evaluate(el=>getComputedStyle(el).position),width<768?'static':'sticky');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const summary=await panel.boundingBox(),heading=await page.locator('main h1').boundingBox();
  if(width<768)assert.ok(summary.y>heading.y);else assert.ok(summary.x>heading.x+heading.width);
  const modules=page.locator('main details');assert.equal(await modules.count(),5);
  await page.getByRole('button',{name:'Expand all',exact:true}).click();
  await page.waitForFunction(()=>[...document.querySelectorAll('main details')].every(el=>el.open));
  await page.getByRole('button',{name:'Collapse all',exact:true}).click();
  await page.waitForFunction(()=>[...document.querySelectorAll('main details')].every(el=>!el.open));
  await modules.first().locator('summary').click();assert.equal(await modules.first().getAttribute('open'),'');
  assert.equal(await page.getByRole('button',{name:'Redeem full scholarship'}).count(),0);
  assert.equal(await page.locator('video, main iframe').count(),0);
  assert.equal(await page.getByRole('button',{name:'Preview',exact:true}).count(),1);await page.getByRole('button',{name:'Preview',exact:true}).click();const dialog=page.getByRole('dialog');await dialog.getByText('Video source',{exact:true}).waitFor();assert.ok(await dialog.getByText(/existing neural-network video is not robotics instruction/).isVisible());assert.ok((await dialog.locator('iframe').getAttribute('src')).includes('/embed/aircAruvnKk'));await dialog.locator('iframe').evaluate(frame=>window.__previousPreview=frame);await page.keyboard.press('Escape');assert.equal(await page.locator('main iframe').count(),0);assert.ok(await page.evaluate(()=>window.__previousPreview.src==='about:blank'&&!document.contains(window.__previousPreview)));
  assert.equal(await page.getByRole('heading',{name:'Reviews',exact:true}).count(),0);
  await page.screenshot({path:`/tmp/academy-detail-${width}.png`,fullPage:true});
  console.log(`PASS demo layout, accordion and truthful access at ${width}px`);
 }
 await page.goto(base+'/academy');
 const courseIds=await page.locator('li[data-course-id][data-demo="true"]').evaluateAll(nodes=>[...new Set(nodes.map(node=>node.getAttribute('data-course-id')))]);
 assert.ok(courseIds.length>=24);
 for(const width of [1440,390])for(const id of courseIds){
  await page.setViewportSize({width,height:1000});await page.goto(base+'/academy/courses/'+id);await page.getByRole('heading',{level:1}).waitFor();
  await page.getByRole('button',{name:'Expand all',exact:true}).click();
  const lessons=page.locator('#course-content li[data-lesson-id]');assert.ok(await lessons.count()>1);
  const records=await lessons.evaluateAll(nodes=>nodes.map(node=>({id:node.dataset.lessonId,access:node.dataset.access,title:node.querySelector('strong')?.textContent,description:node.querySelector('p')?.textContent,hasVideo:node.dataset.hasVideo})));
  assert.equal(records[0].access,'public');assert.ok(records.slice(1).every(item=>item.access==='enrolled'));assert.equal(new Set(records.map(item=>item.id)).size,records.length);assert.ok(records.every(item=>item.title&&item.description));
  if(id!=='academy-demo-robotics-iot')assert.ok(records.every(item=>item.hasVideo==='false'));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await lessons.first().getByRole('button').click();const viewer=page.getByRole('dialog');await viewer.getByRole('navigation',{name:'Lesson selection'}).waitFor();
  assert.equal(await viewer.getByRole('navigation',{name:'Lesson selection'}).getByRole('button').evaluateAll(nodes=>nodes.filter(node=>!node.disabled).length),1);
  if(records[0].hasVideo==='false'){await viewer.getByRole('status').filter({hasText:'Video not supplied'}).waitFor();assert.equal(await viewer.locator('video,iframe').count(),0);}
  assert.ok(await viewer.evaluate(el=>el.scrollWidth<=el.clientWidth));await page.keyboard.press('Escape');assert.equal(await page.locator('main video,main iframe').count(),0);
 }
 console.log(`PASS all ${courseIds.length} demo curricula use one template/viewer: stable IDs, descriptions, intro-only access, missing media, desktop/mobile`);
 await page.goto(base+'/academy/courses/'+slug);
 const links=await page.locator('main a[href^="/academy/courses/"]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('href')));
 assert.ok(links.length>=3);
 for(const href of new Set(links)){const response=await context.request.get(base+href);assert.equal(response.status(),200,href);}
 await page.goto(`${base}/academy/login?returnTo=${encodeURIComponent('/academy/courses/'+slug)}`);
 assert.ok((await page.getByRole('link',{name:'Create account',exact:true}).getAttribute('href')).includes(encodeURIComponent('/academy/courses/'+slug)));
 console.log('PASS related-course navigation and course-return signup link');

}finally{await context.close();await browser.close();}
