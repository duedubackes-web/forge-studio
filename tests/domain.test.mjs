import test from "node:test";
import assert from "node:assert/strict";
import {
  createRun,
  reviewStatus,
  reserveBudget,
  settleBudget,
  planRequirements,
} from "../src/domain.mjs";
const input = {
  prompt: "Criar um painel com login e cadastro de dados.",
  budgetCents: 1000,
};
test("plans disclose their origin and never report an executed test", () => {
  const p = planRequirements(input);
  assert.equal(p.engine, "local-rules-v1");
  assert.match(p.disclosure, /Sem chamada de IA/);
  assert.equal(createRun("p", input).checks.length, 0);
  assert.ok(p.features.some((f) => f.id === "identity"));
  assert.ok(p.features.some((f) => f.id === "data"));
});
test("missing or failed gates block review; newest failure supersedes old pass", () => {
  const r = createRun("p", input);
  assert.equal(reviewStatus(r).missing.length, 3);
  r.checks = ["functional", "visual", "data-isolation"].map((gate) => ({
    gate,
    outcome: "pass",
    source: "operator-declared",
    specHash: r.specHash,
  }));
  assert.equal(reviewStatus(r).status, "ready-for-human-review");
  r.checks.push({ gate: "functional", outcome: "fail" });
  assert.deepEqual(reviewStatus(r).missing, ["functional"]);
});
test("separate specifications have stable but distinct content identities", () => {
  assert.equal(createRun("p", input).specHash, createRun("p", input).specHash);
  assert.notEqual(
    createRun("p", input).specHash,
    createRun("p", { ...input, prompt: input.prompt + " Incluir exportação." })
      .specHash,
  );
});
test("reservations account for in-flight work and prevent aggregate overspend", () => {
  let l = { limitCents: 100, spentCents: 0, reservations: {} };
  l = reserveBudget(l, "first", 70);
  assert.throws(() => reserveBudget(l, "second", 40), /Budget exceeded/);
  assert.deepEqual(reserveBudget(l, "first", 70), l);
  assert.throws(() => reserveBudget(l, "first", 60), /conflict/);
  l = settleBudget(l, "first", 50);
  assert.equal(l.spentCents, 50);
  assert.deepEqual(l.reservations, {});
  assert.equal(reserveBudget(l, "second", 50).reservations.second, 50);
});
test("budget rejects fractional, negative, over-reservation and double settlement", () => {
  const l = { limitCents: 100, spentCents: 0, reservations: {} };
  for (const n of [-1, 1.1, NaN, Infinity])
    assert.throws(() => reserveBudget(l, "x", n));
  const r = reserveBudget(l, "x", 50);
  assert.throws(() => settleBudget(r, "x", 51));
  assert.throws(() => settleBudget(settleBudget(r, "x", 30), "x", 30));
});
