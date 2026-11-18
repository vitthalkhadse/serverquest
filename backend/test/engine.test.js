import test from "node:test";
import assert from "node:assert";
import { runCommand } from "../src/engine.js";

const level = {
  commands: [
    { pattern: "^ls", output: "a.txt" },
    { pattern: "^fix", output: "done", solves: true },
  ],
};

test("normal command solve nahi karta", () => {
  assert.deepStrictEqual(runCommand(level, "ls -l"), { output: "a.txt", solved: false });
});
test("sahi command solve karta hai", () => {
  assert.strictEqual(runCommand(level, "fix it").solved, true);
});
test("unknown command", () => {
  assert.strictEqual(runCommand(level, "xyz").solved, false);
});
