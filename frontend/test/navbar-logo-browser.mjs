import assert from 'node:assert/strict';
const { chromium } = await import(process.env.TECHYFELLOW_PLAYWRIGHT_MODULE ?? 'playwright');
const base = process.env.TECHYFELLOW_NAVBAR_URL ?? 'http://localhost:8081';
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
try {
const p=await b.newPage({viewport:{width:1440,height:900}});await p.goto(base);
const v=p.locator('header video');await p.waitForFunction(()=>document.querySelector('header video')?.currentTime>0);
assert.equal(await v.evaluate(e=>e.muted&&!e.loop&&!e.controls&&e.playsInline),true);
assert.deepEqual(await v.evaluate(e=>[e.videoWidth,e.videoHeight]),[368,368]);
const link=p.getByRole('link',{name:'Techy Fellow — Home',exact:true});assert.equal(await link.getAttribute('href'),'/');
const before=await link.boundingBox();await p.getByRole('navigation',{name:'Main navigation',exact:true}).getByRole('button',{name:'Solutions',exact:true}).hover();await p.waitForTimeout(180);assert.equal(await v.count(),1);
await p.waitForFunction(()=>!document.querySelector('header video'),{},{timeout:45000});assert.equal(await p.locator('header img').evaluate(e=>e.complete&&e.naturalWidth>0),true);assert.deepEqual(await link.boundingBox(),before);
await p.getByRole('navigation',{name:'Main navigation',exact:true}).getByRole('button',{name:'Company',exact:true}).click();await p.locator('#public-desktop-company').getByRole('link',{name:'About',exact:true}).click();await p.waitForURL('**/about');assert.equal(await v.count(),0);
await p.reload();await p.waitForFunction(()=>document.querySelector('header video')?.currentTime>0);console.log('PASS actual playback/end fallback, stable box, rerenders/navigation no replay, reload replay');
const reduced=await b.newPage({viewport:{width:320,height:700},reducedMotion:'reduce'});await reduced.goto(base);assert.equal(await reduced.locator('header video').count(),0);await reduced.waitForFunction(()=>document.querySelector('header img')?.naturalWidth>0);assert.equal(await reduced.evaluate(()=>document.documentElement.scrollWidth<=320),true);
const mobile=await b.newPage({viewport:{width:320,height:700},isMobile:true,hasTouch:true});await mobile.goto(base);await mobile.waitForFunction(()=>document.querySelector('header video')?.currentTime>0);assert.equal(await mobile.locator('header video').evaluate(e=>e.getBoundingClientRect().width),48);await mobile.getByRole('button',{name:'Open navigation menu'}).tap();await mobile.getByRole('dialog').getByRole('button',{name:'Close navigation menu'}).tap();console.log('PASS reduced motion and 320px mobile playback/menu');
for(const mode of ['reject','network']) {const q=await b.newPage();if(mode==='reject') await q.addInitScript(()=>{HTMLMediaElement.prototype.play=function(){return Promise.reject(new DOMException('Blocked','NotAllowedError'));};});else await q.route('**/brand/logo.mp4',r=>r.abort());await q.goto(base);await q.waitForFunction(()=>!document.querySelector('header video')&&document.querySelector('header img')?.naturalWidth>0);await q.close();}console.log('PASS autoplay rejection and media failure fallback');
}finally{await b.close();}
