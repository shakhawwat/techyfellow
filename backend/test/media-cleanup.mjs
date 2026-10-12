// Explicit cleanup only for the owned Step 10 synthetic database; never touches object storage or another database.
import assert from 'node:assert/strict';import mongoose from 'mongoose';
assert.equal(process.env.NODE_ENV,'test');assert.equal(process.env.MONGODB_URI,'mongodb://mongodb:27017/techyfellow_test_step10?replicaSet=rs0');
const input=JSON.parse(await new Promise(resolve=>{let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>resolve(s));}));assert.match(input.runId,/^[a-f0-9]{32}$/);
const c=await mongoose.createConnection(process.env.MONGODB_URI).asPromise();try{assert.ok(await c.db.collection('synthetic_test_ownership').findOne({_id:'step10',runId:input.runId}));await c.dropDatabase();assert.equal((await c.db.listCollections().toArray()).length,0);console.log('PASS: owned synthetic Step 10 database cleaned and verified empty');}finally{await c.close();}
