import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
import { request as httpRequest } from "node:http";
import { createApp } from "../src/server.mjs";
import { Store } from "../src/store.mjs";
async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), "forge-test-"));
  const dataPath = join(dir, "store.json");
  const app = createApp({ dataPath });
  app.listen(0, "127.0.0.1");
  await once(app, "listening");
  t.after(async () => {
    await new Promise((resolve) => app.close(resolve));
    await rm(dir, { recursive: true, force: true });
  });
  const base = `http://127.0.0.1:${app.address().port}`;
  return {
    base,
    dataPath,
    request: async (path, body, headers = {}) => {
      const r = await fetch(base + path, {
        method: body ? "POST" : "GET",
        headers: { "Content-Type": "application/json", ...headers },
        body: body ? JSON.stringify(body) : undefined,
      });
      return { status: r.status, body: await r.json() };
    },
  };
}
test("project → plan → evidence flow persists with provenance and no fabricated execution", async (t) => {
  const f = await fixture(t);
  const p = await f.request("/api/projects", { name: "Projeto de teste" });
  assert.equal(p.status, 201);
  const path = `/api/projects/${p.body.id}`;
  const r = await f.request(path + "/runs", {
    prompt: "Construir portal com login e dados.",
    budgetCents: 1000,
  });
  assert.equal(r.status, 201);
  assert.equal(r.body.review.status, "needs-evidence");
  for (const gate of ["functional", "visual", "data-isolation"]) {
    const c = await f.request(`${path}/runs/${r.body.id}/checks`, {
      gate,
      outcome: "pass",
      evidence: "Cenário conferido manualmente em ambiente de teste.",
    });
    assert.equal(c.status, 201);
    assert.equal(c.body.checks.at(-1).source, "operator-declared");
    assert.equal(c.body.checks.at(-1).specHash, r.body.specHash);
  }
  const saved = new Store(f.dataPath).project(p.body.id);
  assert.equal(saved.runs[0].review.status, "ready-for-human-review");
  assert.equal(saved.runs[0].spentCents, 0);
  const other = await f.request("/api/projects", { name: "Outro projeto" });
  assert.equal(
    (
      await f.request(
        `/api/projects/${other.body.id}/runs/${r.body.id}/checks`,
        {
          gate: "functional",
          outcome: "pass",
          evidence: "Tentativa fora do projeto de origem.",
        },
      )
    ).status,
    404,
  );
});
test("invalid input and cross-origin writes are rejected without persistence", async (t) => {
  const f = await fixture(t);
  assert.equal((await f.request("/api/projects", { name: "x" })).status, 400);
  assert.equal(
    (
      await f.request(
        "/api/projects",
        { name: "Exemplo" },
        { Origin: "https://untrusted.example" },
      )
    ).status,
    403,
  );
  const badHost = await new Promise((resolve, reject) => {
    const req = httpRequest(
      f.base + "/api/projects",
      { headers: { host: "untrusted.example:4173" } },
      (res) => {
        res.resume();
        res.on("end", () => resolve(res.statusCode));
      },
    );
    req.on("error", reject);
    req.end();
  });
  assert.equal(badHost, 403);
  assert.deepEqual((await f.request("/api/projects")).body, []);
  const r = await fetch(f.base + "/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{broken",
  });
  assert.equal(r.status, 400);
  const oversized = await f.request("/api/projects", {
    name: "Exemplo",
    description: "x".repeat(17000),
  });
  assert.equal(oversized.status, 413);
});
test("unknown resources do not expose files and static app sets browser policy", async (t) => {
  const f = await fixture(t);
  assert.equal((await f.request("/package.json")).status, 404);
  const home = await fetch(f.base + "/");
  assert.equal(home.status, 200);
  assert.match(
    home.headers.get("content-security-policy"),
    /frame-ancestors 'none'/,
  );
  assert.match(await home.text(), /Forge Studio/);
});
test("corrupted persistence fails visibly instead of resetting user data", async (t) => {
  const dir = await mkdtemp(join(tmpdir(), "forge-corrupt-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const path = join(dir, "store.json");
  await writeFile(path, "{broken");
  assert.throws(() => new Store(path));
  assert.equal(await readFile(path, "utf8"), "{broken");
});

test("export API preserves project history and provides verifiable download", async (t) => {
  const f = await fixture(t);
  const p = await f.request("/api/projects", { name: "Backup original" });
  const path = `/api/projects/${p.body.id}`;
  await f.request(path + "/runs", {
    prompt: "Criar um portal com login e painel.",
    budgetCents: 500,
  });
  const response = await fetch(f.base + path + "/export");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-disposition"), /^attachment;/);
  const backup = await response.json();
  const { verifyExport } = await import("../src/backup.mjs");
  assert.equal(verifyExport(backup).runs, 1);
  assert.equal(backup.payload.project.name, "Backup original");
  assert.equal(
    (
      await f.request(
        "/api/projects/00000000-0000-4000-8000-000000000000/export",
      )
    ).status,
    404,
  );
});
