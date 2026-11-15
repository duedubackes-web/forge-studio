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
  assert.equal(Object.hasOwn(backup.payload.project.runs[0], "review"), false);
  assert.equal(
    (
      await f.request(
        "/api/projects/00000000-0000-4000-8000-000000000000/export",
      )
    ).status,
    404,
  );
});

test("restore creates collision-free copies, preserves original and invalidates imported approvals", async (t) => {
  const f = await fixture(t);
  const p = (await f.request("/api/projects", { name: "Projeto recuperável" }))
    .body;
  const path = `/api/projects/${p.id}`;
  const r = (
    await f.request(path + "/runs", {
      prompt: "Portal com login e painel de clientes.",
      budgetCents: 1000,
    })
  ).body;
  for (const gate of ["functional", "visual", "data-isolation"])
    await f.request(`${path}/runs/${r.id}/checks`, {
      gate,
      outcome: "pass",
      evidence: "Verificação manual concluída no ambiente original.",
    });
  const backup = (await f.request(path + "/export")).body;
  const first = await f.request("/api/projects/import", backup);
  const second = await f.request("/api/projects/import", backup);
  assert.equal(first.status, 201);
  assert.equal(second.status, 201);
  assert.notEqual(first.body.id, p.id);
  assert.notEqual(first.body.id, second.body.id);
  assert.notEqual(first.body.runs[0].id, r.id);
  assert.notEqual(first.body.runs[0].id, second.body.runs[0].id);
  assert.equal(first.body.runs[0].review.status, "needs-evidence");
  assert.equal(first.body.runs[0].checks.length, 3);
  assert.ok(
    first.body.runs[0].checks.every(
      (c) => c.source === "imported-operator-declared",
    ),
  );
  assert.equal(first.body.restoredFrom.backupDigest, backup.integrity.digest);
  assert.equal(
    (await f.request(path)).body.runs[0].review.status,
    "ready-for-human-review",
  );
  const newPath = `/api/projects/${first.body.id}`,
    newRun = first.body.runs[0].id;
  for (const gate of ["functional", "visual", "data-isolation"])
    await f.request(`${newPath}/runs/${newRun}/checks`, {
      gate,
      outcome: "pass",
      evidence: "Nova verificação manual após recuperação do projeto.",
    });
  assert.equal(
    (await f.request(newPath)).body.runs[0].review.status,
    "ready-for-human-review",
  );
  const restoredBackup = (await f.request(newPath + "/export")).body;
  assert.equal(
    (await f.request("/api/projects/import", restoredBackup)).status,
    201,
  );
  assert.equal(
    new Store(f.dataPath).project(first.body.id).runs[0].checks.length,
    6,
  );
});
test("malformed, tampered and semantically inconsistent backups never modify persistence", async (t) => {
  const f = await fixture(t);
  const p = (await f.request("/api/projects", { name: "Original protegido" }))
    .body;
  const path = `/api/projects/${p.id}`;
  await f.request(path + "/runs", {
    prompt: "Portal de clientes com dados isolados.",
    budgetCents: 100,
  });
  const backup = (await f.request(path + "/export")).body;
  const before = await readFile(f.dataPath, "utf8");
  const { createHash } = await import("node:crypto");
  const reseal = (x) => {
    x.integrity.digest = createHash("sha256")
      .update(JSON.stringify(x.payload))
      .digest("hex");
    return x;
  };
  const tampered = structuredClone(backup);
  tampered.payload.project.name = "Conteúdo alterado";
  const wrongVersion = structuredClone(backup);
  wrongVersion.payload.formatVersion = 99;
  const foreignRun = structuredClone(backup);
  foreignRun.payload.project.runs[0].projectId =
    "00000000-0000-4000-8000-000000000000";
  reseal(foreignRun);
  const wrongSpec = structuredClone(backup);
  wrongSpec.payload.project.runs[0].plan.prompt =
    "Outro objetivo que não corresponde ao hash.";
  reseal(wrongSpec);
  for (const invalid of [
    {},
    { integrity: backup.integrity },
    tampered,
    reseal(wrongVersion),
    foreignRun,
    wrongSpec,
  ]) {
    assert.equal(
      (await f.request("/api/projects/import", invalid)).status,
      400,
    );
    assert.equal(await readFile(f.dataPath, "utf8"), before);
  }
});

test("manual acceptance binds current evidence, is idempotent and never survives import as approval", async (t) => {
  const f = await fixture(t);
  const project = (
    await f.request("/api/projects", { name: "Aceite rastreável" })
  ).body;
  const path = `/api/projects/${project.id}`;
  let run = (
    await f.request(path + "/runs", {
      prompt: "Portal de clientes com dados e login.",
      budgetCents: 100,
    })
  ).body;
  const endpoint = `${path}/runs/${run.id}/accept`;
  assert.equal(
    (
      await f.request(endpoint, {
        expectedSpecHash: run.specHash,
        expectedCheckIds: Array(3).fill("00000000-0000-4000-8000-000000000000"),
      })
    ).status,
    409,
  );
  for (const gate of ["functional", "visual", "data-isolation"])
    run = (
      await f.request(`${path}/runs/${run.id}/checks`, {
        gate,
        outcome: "pass",
        evidence: "Critério conferido manualmente nesta especificação.",
      })
    ).body;
  const request = {
    expectedSpecHash: run.specHash,
    expectedCheckIds: run.review.currentCheckIds,
  };
  const first = await f.request(endpoint, request);
  assert.equal(first.status, 200);
  assert.equal(first.body.review.accepted, true);
  assert.equal(first.body.acceptances.length, 1);
  const retry = await f.request(endpoint, request);
  assert.equal(retry.body.acceptances.length, 1);
  assert.equal(retry.body.acceptances[0].id, first.body.acceptances[0].id);
  assert.equal(
    new Store(f.dataPath).project(project.id).runs[0].review.accepted,
    true,
  );
  const backup = (await f.request(path + "/export")).body;
  assert.equal(backup.payload.formatVersion, 2);
  const restored = await f.request("/api/projects/import", backup);
  assert.equal(restored.status, 201);
  assert.equal(restored.body.runs[0].review.accepted, false);
  assert.equal(
    restored.body.runs[0].acceptances[0].source,
    "imported-operator-declared",
  );
  run = (
    await f.request(`${path}/runs/${run.id}/checks`, {
      gate: "functional",
      outcome: "pass",
      evidence: "Nova conferência altera a versão do conjunto de evidências.",
    })
  ).body;
  assert.equal(run.review.accepted, false);
  assert.equal((await f.request(endpoint, request)).status, 409);
  const renewed = await f.request(endpoint, {
    expectedSpecHash: run.specHash,
    expectedCheckIds: run.review.currentCheckIds,
  });
  assert.equal(renewed.body.acceptances.length, 2);
  assert.equal(renewed.body.review.accepted, true);
  const failed = await f.request(`${path}/runs/${run.id}/checks`, {
    gate: "visual",
    outcome: "fail",
    evidence: "Uma regressão foi observada depois do aceite manual.",
  });
  assert.equal(failed.body.review.accepted, false);
  assert.equal(failed.body.review.status, "needs-evidence");
});

test("dossier download binds project, specification, current evidence and content digest", async (t) => {
  const f = await fixture(t);
  const p = (
    await f.request("/api/projects", {
      name: "Dossiê original",
      description: "Contexto para implementar um portal.",
    })
  ).body;
  const path = `/api/projects/${p.id}`;
  let run = (
    await f.request(path + "/runs", {
      prompt: "Implementar portal com login e cadastro de clientes.",
      budgetCents: 2500,
    })
  ).body;
  for (const gate of ["functional", "visual", "data-isolation"])
    run = (
      await f.request(`${path}/runs/${run.id}/checks`, {
        gate,
        outcome: "pass",
        evidence: "Conferência manual registrada para esta tarefa.",
      })
    ).body;
  await f.request(`${path}/runs/${run.id}/accept`, {
    expectedSpecHash: run.specHash,
    expectedCheckIds: run.review.currentCheckIds,
  });
  const endpoint = `${path}/runs/${run.id}/dossier`;
  let response = await fetch(f.base + endpoint);
  let text = await response.text();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-disposition"), /^attachment;/);
  assert.match(response.headers.get("content-type"), /^text\/markdown/);
  const { createHash } = await import("node:crypto");
  assert.equal(
    response.headers.get("x-artifact-sha256"),
    createHash("sha256").update(text).digest("hex"),
  );
  assert.ok(text.includes(p.id) && text.includes(run.specHash));
  assert.match(text, /Aceite manual vigente/);
  assert.match(text, /IA não conectada/);
  await f.request(`${path}/runs/${run.id}/checks`, {
    gate: "visual",
    outcome: "fail",
    evidence: "Uma regressão visual foi observada na revisão posterior.",
  });
  text = await (await fetch(f.base + endpoint)).text();
  assert.match(text, /Critérios pendentes de revisão/);
  assert.doesNotMatch(text, /Aceite manual vigente/);
  assert.match(text, /Histórico de aceites/);
  const other = (await f.request("/api/projects", { name: "Outro projeto" }))
    .body;
  assert.equal(
    (await fetch(`${f.base}/api/projects/${other.id}/runs/${run.id}/dossier`))
      .status,
    404,
  );
});
