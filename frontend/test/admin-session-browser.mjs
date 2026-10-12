// Isolated real session/role APIs; never use an existing database or print credentials.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {randomBytes,createHash} from 'node:crypto';
import {createServer,request} from 'node:http';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
assert.equal(process.env.NODE_ENV,'test');assert.ok(process.env.TECHYFELLOW_TEST_MONGO);
const require=createRequire(new URL('../../backend/package.json',import.meta.url));
const dbName=`techyfellow_test_admin_session_${randomBytes(6).toString('hex')}`;
process.env.MONGODB_URI=`${process.env.TECHYFELLOW_TEST_MONGO}/${dbName}?replicaSet=rs0&directConnection=true`;
process.env.AUTH_ALLOWED_ORIGINS='http://localhost:14002';process.env.EMAIL_ENABLED='false';
const {NestFactory}=require('@nestjs/core'),{getConnectionToken}=require('@nestjs/mongoose');
const app=await NestFactory.create(require('./dist/app.module.js').AppModule,{logger:false});
app.setGlobalPrefix('api/v1');app.useGlobalFilters(new (require('./dist/auth/auth-exception.filter.js').AuthExceptionFilter)());
const db=app.get(getConnectionToken());await db.asPromise();assert.equal(db.name,dbName);assert.equal((await db.db.listCollections().toArray()).length,0);
let next,proxy,browser,outage=false,checks=0;
try{
 for(const def of Object.values(require('./dist/auth/auth.schemas.js').authDefinitions)){const model=db.model(def.name,def.schema,def.collection);await model.createCollection();await model.createIndexes();}
 const password=randomBytes(24).toString('base64url');const passwordHash=await require('./dist/auth/password.js').hashPassword(password);
 const fixtures={};
 for(const role of ['SUPER_ADMIN','MEMBER']){const user=await db.model('User').create({email:`${role.toLowerCase()}@example.invalid`,passwordHash,role,enabled:true});const token=randomBytes(32).toString('base64url');const s=await db.model('AuthSession').create({userId:user._id,tokenHash:createHash('sha256').update(token).digest('hex'),expiresAt:new Date(Date.now()+600000)});fixtures[role]={token,sessionId:s._id};}
 await app.listen(14001,'127.0.0.1');
 next=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--port','13001'],{cwd:new URL('../',import.meta.url),env:{...process.env,NODE_ENV:'production',CONTENT_API_BASE_URL:'http://127.0.0.1:14001/api/v1'},stdio:'ignore'});
 proxy=createServer((req,res)=>{if(req.url==='/api/v1/auth/me'){checks++;if(outage){res.writeHead(outage==='malformed'?200:503,{'Content-Type':outage==='malformed'?'application/json':'text/html'});return res.end(outage==='malformed'?JSON.stringify({data:{user:{id:'000000000000000000000001',email:'invalid@example.invalid',role:'UNKNOWN'}}}):'<html>Service unavailable</html>');}}const upstream=request({hostname:'127.0.0.1',port:req.url.startsWith('/api/v1')?14001:13001,path:req.url,method:req.method,headers:req.headers},response=>{res.writeHead(response.statusCode,response.headers);response.pipe(res);});upstream.on('error',()=>{res.writeHead(503);res.end();});req.pipe(upstream);});await new Promise(resolve=>proxy.listen(14002,'127.0.0.1',resolve));
 const base='http://localhost:14002';for(let i=0;i<60;i++){try{if((await fetch(base+'/admin/login')).ok)break;}catch{}await delay(250);}
 const {chromium}=await import(process.env.TECHYFELLOW_PLAYWRIGHT_MODULE??'playwright');browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
 async function signedIn(role){const ctx=await browser.newContext();await ctx.addCookies([{name:'techyfellow_session',value:fixtures[role].token,url:base,httpOnly:true,sameSite:'Lax'}]);return ctx;}
 const member=await signedIn('MEMBER'),mp=await member.newPage();
 for(const path of ['/auth/me','/admin/access']){const r=await member.request.get(base+'/api/v1'+path);const body=await r.json();console.log('DIAGNOSIS',JSON.stringify({url:base+'/api/v1'+path,status:r.status(),contentType:r.headers()['content-type'],body}));}
 await mp.goto(base+'/admin');
 if(process.env.ADMIN_SESSION_DIAGNOSE==='1'){await mp.getByText('The server response could not be verified. Reload before retrying.',{exact:true}).waitFor();console.log('REPRODUCED: valid MEMBER session is mistaken for an invalid server response');}
 else{
 await mp.getByRole('heading',{name:'Access denied',exact:true}).waitFor();await mp.getByRole('alert').filter({hasText:'Admin credentials are required'}).waitFor();await mp.getByRole('link',{name:'Sign in with an admin account',exact:true}).waitFor();assert.equal((await member.request.get(base+'/api/v1/admin/access')).status(),403);console.log('PASS member remains forbidden with explicit admin-credentials guidance');
 assert.equal((await member.request.get(base+'/api/v1/auth/me',{headers:{Origin:'http://127.0.0.1:14002'}})).status(),403);
 const loginHeaders={Origin:base,'X-CSRF-Protection':'1'};
 assert.equal((await member.request.post(base+'/api/v1/auth/login',{headers:{Origin:base},data:{email:'super_admin@example.invalid',password}})).status(),403);
 assert.equal((await member.request.post(base+'/api/v1/auth/login',{headers:{...loginHeaders,Origin:'http://127.0.0.1:14002'},data:{email:'super_admin@example.invalid',password}})).status(),403);
 assert.equal((await member.request.get(base+'/api/v1/auth/me',{headers:{Origin:base}})).status(),200);
 console.log('PASS exact allowed origin, distinct loopback host rejection and missing CSRF rejection');
 const login=await member.request.post(base+'/api/v1/auth/login',{headers:loginHeaders,data:{email:'super_admin@example.invalid',password}});assert.equal(login.status(),200);
 const cookie=(await member.cookies()).find(c=>c.name==='techyfellow_session');assert.ok(cookie.httpOnly&&cookie.sameSite==='Lax'&&cookie.path==='/');
 const previousChecks=checks;await mp.getByRole('button',{name:'Retry session check',exact:true}).click();await mp.getByRole('button',{name:'Log out',exact:true}).waitFor();assert.ok(checks>previousChecks);console.log('PASS real admin login forwards HttpOnly cookie; Retry recovers from member denial');
 const anonymous=await browser.newContext(),anonymousPage=await anonymous.newPage();await anonymousPage.goto(base+'/admin');await anonymousPage.waitForURL(base+'/admin/login');assert.equal((await anonymous.request.get(base+'/api/v1/auth/me')).status(),401);await anonymous.close();console.log('PASS missing session requests login');
 const admin=await signedIn('SUPER_ADMIN'),page=await admin.newPage();await page.goto(base+'/admin');await page.getByRole('button',{name:'Log out',exact:true}).waitFor();console.log('PASS valid admin session opens admin');
 outage=true;await page.reload();await page.getByRole('heading',{name:'Unable to verify access',exact:true}).waitFor();await page.getByRole('alert').filter({hasText:'service is unavailable'}).waitFor();assert.equal(await page.getByRole('button',{name:'Log out',exact:true}).count(),0);const before=checks;outage=false;await page.getByRole('button',{name:'Retry session check',exact:true}).click();await page.getByRole('button',{name:'Log out',exact:true}).waitFor();assert.ok(checks>before);console.log('PASS HTML service failure hides admin and fresh Retry recovers');
 outage='malformed';await page.reload();await page.getByRole('alert').filter({hasText:'server response could not be verified'}).waitFor();assert.equal(await page.getByRole('button',{name:'Log out',exact:true}).count(),0);outage=false;await page.getByRole('button',{name:'Retry session check',exact:true}).click();await page.getByRole('button',{name:'Log out',exact:true}).waitFor();console.log('PASS unknown role response remains rejected; Retry recovers');
 await db.model('AuthSession').updateOne({_id:fixtures.SUPER_ADMIN.sessionId},{$set:{expiresAt:new Date(Date.now()-1000)}});await page.reload();await page.waitForURL(base+'/admin/login');assert.equal((await admin.request.get(base+'/api/v1/auth/me')).status(),401);console.log('PASS expired session requests login');
 }
}finally{if(browser)await browser.close();if(proxy)await new Promise(resolve=>proxy.close(resolve));if(next){next.kill('SIGTERM');await new Promise(resolve=>next.once('exit',resolve));}await db.dropDatabase();await app.close();}
