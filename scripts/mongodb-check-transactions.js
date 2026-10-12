// Manual development verification only; uses an isolated collection and cleans it.
const testDb = db.getSiblingDB("techyfellow");
const name = "_step4_transaction_check_" + new ObjectId().toString();
const session = db.getMongo().startSession();
const coll = testDb.getCollection(name);
let failed = false;
try {
  if (!db.adminCommand({ hello: 1 }).isWritablePrimary) throw new Error("No writable primary");
  testDb.createCollection(name);
  const transactional = session.getDatabase("techyfellow").getCollection(name);
  session.startTransaction();
  transactional.insertMany([{ _id: 1 }, { _id: 2 }]);
  if (coll.countDocuments({}) !== 0) throw new Error("Uncommitted writes leaked");
  session.commitTransaction();
  if (coll.countDocuments({}) !== 2) throw new Error("Commit verification failed");
  session.startTransaction();
  transactional.insertOne({ _id: 3 });
  session.abortTransaction();
  if (coll.countDocuments({}) !== 2) throw new Error("Abort verification failed");
  print("PASS: transaction isolation, commit and abort verified.");
} catch {
  print("FAIL: development transaction verification.");
  failed = true;
} finally {
  session.endSession();
  coll.drop();
  if (testDb.getCollectionNames().includes(name)) throw new Error("Temporary collection cleanup failed");
  print("PASS: temporary transaction collection removed.");
}

if (failed) quit(1);
