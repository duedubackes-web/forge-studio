import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  readFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { inspectRepository } from "../src/repository.mjs";
function repo(t) {
  const dir = mkdtempSync(join(tmpdir(), "forge-git-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const git = (...args) =>
    execFileSync("git", args, {
      cwd: dir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  git("init", "-b", "main");
  git("config", "user.name", "Forge Test");
  git("config", "user.email", "test@example.invalid");
  return { dir, git };
}
test("commit baseline detects staged, unstaged, untracked and detached state without changing files", (t) => {
  const { dir, git } = repo(t);
  writeFileSync(join(dir, "file.txt"), "original");
  mkdirSync(join(dir, "nested"));
  writeFileSync(join(dir, "nested", "tracked.txt"), "nested content");
  git("add", ".");
  git("commit", "-m", "baseline");
  const first = inspectRepository(dir);
  assert.equal(first.clean, true);
  assert.equal(first.readyForCommitVerification, true);
  assert.equal(first.branch, "main");
  assert.equal(
    inspectRepository(join(dir, "nested")).metadataSha256,
    first.metadataSha256,
  );
  writeFileSync(join(dir, "file.txt"), "not committed");
  writeFileSync(join(dir, "new.txt"), "untracked");
  const dirty = inspectRepository(dir);
  assert.equal(dirty.readyForCommitVerification, false);
  assert.equal(dirty.changes.length, 2);
  assert.equal(readFileSync(join(dir, "file.txt"), "utf8"), "not committed");
  git("add", "file.txt");
  assert.ok(inspectRepository(dir).changes.some((c) => c.code === "M "));
  git("commit", "-m", "update");
  git("add", "new.txt");
  git("commit", "-m", "new");
  git("checkout", "--detach");
  assert.equal(inspectRepository(dir).branch, null);
});
test("empty repositories and non-repositories do not pretend to have a commit", (t) => {
  const { dir } = repo(t);
  const empty = inspectRepository(dir);
  assert.equal(empty.commit, null);
  assert.equal(empty.readyForCommitVerification, false);
  const outside = mkdtempSync(join(tmpdir(), "forge-outside-"));
  t.after(() => rmSync(outside, { recursive: true, force: true }));
  assert.throws(() => inspectRepository(outside));
});
