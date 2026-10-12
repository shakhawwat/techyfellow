import mongoose from 'mongoose';
import assert from 'node:assert/strict';
const uri = 'mongodb://mongodb:27017/techyfellow_test_step15?replicaSet=rs0';
assert.equal(process.env.NODE_ENV, 'test'); assert.equal(process.env.MONGODB_URI, uri);
const input = JSON.parse(await new Promise(resolve => { let value = ''; process.stdin.on('data', data => value += data); process.stdin.on('end', () => resolve(value)); }));
const connection = await mongoose.createConnection(uri).asPromise();
try { const marker = await connection.db.collection('synthetic_test_ownership').findOne({ _id: 'step15' }); assert.equal(marker?.runId, input.runId); if (process.argv[2] === 'reset-login-throttles') { await connection.db.collection('login_throttles').deleteMany({}); console.log('Owned synthetic login counters reset for resumed verification'); } else { assert.ok(process.argv[2] === undefined || process.argv[2] === 'cleanup'); await connection.dropDatabase(); assert.equal((await connection.db.listCollections().toArray()).length, 0); console.log('PASS: exact owned Step 15 database dropped and verified empty'); } } finally { await connection.close(); }
