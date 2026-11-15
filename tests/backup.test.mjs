import test from "node:test";
import assert from "node:assert/strict";
import { exportProject, verifyExport } from "../src/backup.mjs";
const project = {
  id: "d18289c8-d78b-44f0-98c9-1cc4989c67a4",
  name: "Portal original",
  description: "Objetivo de teste",
  createdAt: "2026-11-15T12:00:00.000Z",
  runs: [],
};
test("portable export roundtrips through JSON and detects content changed after export", () => {
  const backup = JSON.parse(JSON.stringify(exportProject(project)));
  assert.deepEqual(backup.payload.project, project);
  assert.equal(verifyExport(backup).valid, true);
  backup.payload.project.name = "Alterado";
  assert.throws(() => verifyExport(backup), /SHA-256/);
});
test("unsupported format and malformed exports are rejected", () => {
  const backup = exportProject(project);
  backup.payload.formatVersion = 99;
  assert.throws(() => verifyExport(backup));
  for (const x of [null, {}, { integrity: { algorithm: "md5" } }])
    assert.throws(() => verifyExport(x));
});
