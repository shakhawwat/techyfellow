// Development only. Never reconfigure or discard an existing replica set.
try {
  const config = rs.conf();
  if (config._id !== "rs0" || config.members.length !== 1 || config.members[0].host !== "mongodb:27017") {
    throw new Error("Unexpected development replica-set configuration");
  }
} catch (error) {
  if (error.code !== 94) {
    print("Replica-set initialization failed; inspect development configuration.");
    quit(1);
  }
  const result = rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "mongodb:27017" }] });
  if (result.ok !== 1) {
    print("Replica-set initialization failed.");
    quit(1);
  }
}
for (let attempt = 0; attempt < 60; attempt++) {
  if (db.adminCommand({ hello: 1 }).isWritablePrimary) {
    print("Development replica set ready.");
    quit(0);
  }
  sleep(1000);
}
print("Replica-set primary election timed out.");
quit(1);
