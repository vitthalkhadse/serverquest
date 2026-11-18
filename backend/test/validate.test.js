import test from "node:test";
import assert from "node:assert";
import {
  cleanPlayer,
  cleanAttempts,
  cleanCommand,
  cleanId,
} from "../src/validate.js";

test("player: script tag reject", () => {
  assert.strictEqual(cleanPlayer("<script>alert(1)</script>"), "anonymous");
  assert.strictEqual(cleanPlayer("Rahul_01"), "Rahul_01");
});
test("attempts clamp", () => {
  assert.strictEqual(cleanAttempts(-5), 1);
  assert.strictEqual(cleanAttempts(99999), 200);
  assert.strictEqual(cleanAttempts("abc"), 1);
});
test("command length/type", () => {
  assert.strictEqual(cleanCommand("a".repeat(101)), null);
  assert.strictEqual(cleanCommand({ $ne: 1 }), null);
  assert.strictEqual(cleanCommand("ls"), "ls");
});
test("id sirf digits", () => {
  assert.strictEqual(cleanId("1 OR 1=1"), null);
  assert.strictEqual(cleanId("3"), 3);
});
