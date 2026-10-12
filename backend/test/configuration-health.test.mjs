import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { validateEnvironment } = require("../dist/config/environment.js");
const { DatabaseService } = require("../dist/database.service.js");
const { HealthController } = require("../dist/health.controller.js");

test("runtime validation rejects invalid settings without disclosing values", () => {
  const uri = "mongodb://mongodb:27017/techyfellow?replicaSet=rs0";
  const defaults = validateEnvironment({ MONGODB_URI: uri });
  assert.equal(defaults.PORT, 4000);
  assert.equal(defaults.NODE_ENV, "development");
  for (const env of [
    {}, { MONGODB_URI: "https://user:SECRET@internal.example" },
    { MONGODB_URI: uri, PORT: "4000junk" },
    { MONGODB_URI: uri, PORT: "0" },
    { MONGODB_URI: uri, NODE_ENV: "SECRET" },
  ]) {
    assert.throws(() => validateEnvironment(env), error => {
      assert.ok(!error.message.includes("SECRET"));
      assert.ok(!error.message.includes("internal.example"));
      return true;
    });
  }
});

test("liveness is independent; readiness reports 503 on disconnected/failed ping", async () => {
  for (const connection of [
    { readyState: 0 },
    { readyState: 1, db: { admin: () => ({ command: async () => { throw new Error("SECRET"); } }) } },
  ]) {
    const service = new DatabaseService(connection, {});
    const controller = new HealthController(service);
    assert.deepEqual(controller.live(), { status: "ok" });
    await assert.rejects(controller.ready(), error => {
      assert.equal(error.getStatus(), 503);
      assert.deepEqual(error.getResponse(), { status: "unavailable" });
      return true;
    });
  }
});

test("connected state alone does not imply readiness; only successful ping does", async () => {
  const service = new DatabaseService({ readyState: 1, db: { admin: () => ({ command: async () => ({ ok: 1 }) }) } }, {});
  assert.deepEqual(await new HealthController(service).ready(), { status: "ok" });
});

test("stalled ping has a bounded readiness response", async () => {
  const service = new DatabaseService({ readyState: 1, db: { admin: () => ({ command: () => new Promise(() => {}) }) } }, {});
  const start = performance.now();
  assert.equal(await service.isReady(), false);
  assert.ok(performance.now() - start < 3000);
});
