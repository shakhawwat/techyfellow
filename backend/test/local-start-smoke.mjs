import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const assert = require('node:assert/strict');
const mongoose = require('/app/node_modules/mongoose');
const { leadDefinitions } = require('/app/dist/leads/lead.schema');
const { authDefinitions } = require('/app/dist/auth/auth.schemas');
const { notificationDefinition } = require('/app/dist/notifications/notification.schema');
const { NotificationService } = require('/app/dist/notifications/notification.service');
const { LeadService } = require('/app/dist/leads/lead.service');
const { NotificationProcessor } = require('/app/dist/notifications/processor');
const { emailConfiguration } = require('/app/dist/notifications/email.config');
(async () => {
 const uri='mongodb://mongodb:27017/techyfellow_test_local_start?replicaSet=rs0';
 assert.equal(process.env.NODE_ENV,'test');assert.equal(process.env.MONGODB_URI,uri);
 const connection=await mongoose.createConnection(uri,{autoCreate:false,autoIndex:false}).asPromise();let owned=false;
 try {
  assert.equal((await connection.db.listCollections().toArray()).length,0,'Refuse any existing test database');owned=true;
  await connection.db.collection('synthetic_test_ownership').insertOne({_id:'local-start'});
  const leads=connection.model('Lead',leadDefinitions.lead.schema,'leads'),audits=connection.model('LeadAudit',leadDefinitions.audit.schema,'lead_audits'),throttles=connection.model('LeadThrottle',leadDefinitions.throttle.schema,'lead_throttles'),users=connection.model('User',authDefinitions.user.schema,'users'),jobs=connection.model('NotificationJob',notificationDefinition.schema,'notification_jobs');
  for(const model of [leads,audits,throttles,users,jobs])await model.createIndexes();
  const service=new LeadService(connection,new NotificationService(jobs),leads,audits,throttles,users);
  const body={type:'contact',name:'Synthetic local startup check',email:'synthetic-local-start@example.invalid',consent:true,message:'Synthetic local verification only.'},key='synthetic-local-start-00000001';
  const first=await service.submit(body,key,'127.0.0.1');const retries=await Promise.all([service.submit(body,key,'127.0.0.1'),service.submit(body,key,'127.0.0.1')]);for(const reply of retries)assert.deepEqual(reply,first);
  assert.equal(await leads.countDocuments(),1);assert.equal(await jobs.countDocuments(),2);
  let sends=0;const processor=new NotificationProcessor(jobs,leads,emailConfiguration({NODE_ENV:'test',EMAIL_ENABLED:'false'}),{send:async()=>{sends++;throw Error('Must not send');}});
  for(let attempt=0;attempt<3;attempt++)assert.equal(await processor.processOne(),'paused');assert.equal(sends,0);assert.equal(await jobs.countDocuments({status:'pending',attempts:0}),2);
  console.log('PASS: isolated lead plus two jobs persist; unchanged retries deduplicate; disabled processor makes zero provider calls and retains jobs');
 }finally{if(owned){await connection.dropDatabase();assert.equal((await connection.db.listCollections().toArray()).length,0);console.log('PASS: only owned synthetic test database cleaned');}await connection.close();}
})().catch(()=>{console.error('FAIL: isolated local inquiry smoke check');process.exitCode=1;});
