import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { projectInput, runInput, checkInput, gates } from "./domain.mjs";
const hash = z.string().regex(/^[a-f0-9]{64}$/);
const nonnegative = z.number().int().nonnegative();
const originSchema = z
  .object({
    backupDigest: hash,
    projectId: z.uuid(),
    importedAt: z.iso.datetime(),
  })
  .strict();
const planSchema = z
  .object({
    engine: z.literal("local-rules-v1"),
    disclosure: z.string().max(2000),
    prompt: runInput.shape.prompt,
    budgetCents: runInput.shape.budgetCents,
    currency: z.literal("BRL"),
    features: z
      .array(
        z
          .object({
            id: z.string().max(80),
            title: z.string().max(200),
            acceptance: z.string().max(2000),
            status: z.literal("proposed"),
          })
          .strict(),
      )
      .max(100),
    tasks: z
      .array(
        z
          .object({ title: z.string().max(200), detail: z.string().max(2000) })
          .strict(),
      )
      .max(100),
    requiredGates: z
      .array(
        z
          .object({
            id: checkInput.shape.gate,
            label: z.string().max(200),
            requirement: z.string().max(2000),
          })
          .strict(),
      )
      .length(3),
  })
  .strict();
const checkSchema = checkInput
  .extend({
    id: z.uuid(),
    source: z.enum(["operator-declared", "imported-operator-declared"]),
    specHash: hash,
    createdAt: z.iso.datetime(),
    importedFrom: z
      .object({
        checkId: z.uuid(),
        source: z.enum(["operator-declared", "imported-operator-declared"]),
      })
      .strict()
      .optional(),
  })
  .strict();
const runSchema = z
  .object({
    id: z.uuid(),
    projectId: z.uuid(),
    createdAt: z.iso.datetime(),
    specHash: hash,
    plan: planSchema,
    checks: z.array(checkSchema),
    spentCents: nonnegative,
    reservedCents: nonnegative,
    acceptances: z
      .array(
        z
          .object({
            id: z.uuid(),
            createdAt: z.iso.datetime(),
            source: z.enum(["operator-declared", "imported-operator-declared"]),
            specHash: hash,
            checkIds: z.array(z.uuid()).length(3),
          })
          .strict(),
      )
      .optional(),
    review: z
      .object({
        status: z.enum(["needs-evidence", "ready-for-human-review"]),
        accepted: z.boolean().optional(),
        acceptedAt: z.iso.datetime().nullable().optional(),
        currentCheckIds: z.array(z.uuid().nullable()).length(3).optional(),
        missing: z.array(checkInput.shape.gate),
        assurance: z.string().max(2000),
      })
      .strict()
      .optional(),
    importedFrom: z
      .object({ runId: z.uuid(), specHash: hash })
      .strict()
      .optional(),
  })
  .strict();
export const payloadSchema = z
  .object({
    formatVersion: z.union([z.literal(1), z.literal(2)]),
    kind: z.literal("forge-project-export"),
    exportedAt: z.iso.datetime(),
    project: projectInput
      .extend({
        id: z.uuid(),
        createdAt: z.iso.datetime(),
        runs: z.array(runSchema),
        restoredFrom: originSchema.optional(),
      })
      .strict(),
  })
  .strict();
const digest = (payload) =>
  createHash("sha256").update(JSON.stringify(payload)).digest("hex");
function validatePayload(payload) {
  payloadSchema.parse(payload);
  if (
    payload.formatVersion === 1 &&
    payload.project.runs.some((run) => run.acceptances?.length)
  )
    throw Error("Histórico de aceite exige backup no formato 2.");
  const project = payload.project,
    ids = new Set(),
    checkIds = new Set();
  for (const run of project.runs) {
    if (ids.has(run.id) || run.projectId !== project.id)
      throw Error("Identidade de execução inválida no backup.");
    ids.add(run.id);
    if (digest(run.plan) !== run.specHash)
      throw Error("Especificação não corresponde ao SHA-256 da execução.");
    if (
      run.plan.requiredGates.length !==
        new Set(run.plan.requiredGates.map((g) => g.id)).size ||
      !gates.every((g) => run.plan.requiredGates.some((x) => x.id === g.id))
    )
      throw Error("Critérios de revisão inválidos.");
    for (const receipt of run.acceptances ?? []) {
      if (
        receipt.specHash !== run.specHash ||
        new Set(receipt.checkIds).size !== 3 ||
        !receipt.checkIds.every((id) => run.checks.some((c) => c.id === id))
      )
        throw Error("Aceite não corresponde às evidências do backup.");
    }
    for (const check of run.checks) {
      if (checkIds.has(check.id) || check.specHash !== run.specHash)
        throw Error("Identidade ou especificação da evidência inválida.");
      checkIds.add(check.id);
    }
  }
}
export function exportProject(project) {
  const payload = {
    formatVersion: project.runs.some((run) => run.acceptances?.length) ? 2 : 1,
    kind: "forge-project-export",
    exportedAt: new Date().toISOString(),
    project: structuredClone(project),
  };
  validatePayload(payload);
  return {
    payload,
    integrity: {
      algorithm: "sha256",
      canonicalization: "JSON.stringify(payload)",
      digest: digest(payload),
    },
  };
}
export function verifyExport(backup) {
  if (
    backup?.integrity?.algorithm !== "sha256" ||
    backup?.integrity?.canonicalization !== "JSON.stringify(payload)" ||
    !hash.safeParse(backup?.integrity?.digest).success
  )
    throw Error("Formato de integridade inválido.");
  validatePayload(backup.payload);
  if (digest(backup.payload) !== backup.integrity.digest)
    throw Error("O conteúdo não corresponde ao SHA-256 registrado.");
  return {
    valid: true,
    projectId: backup.payload.project.id,
    runs: backup.payload.project.runs.length,
    assurance:
      "Integridade do arquivo, não autenticidade da origem nem comprovação dos testes.",
  };
}
export function restoreProject(backup) {
  verifyExport(backup);
  const original = backup.payload.project,
    id = randomUUID(),
    importedAt = new Date().toISOString();
  const project = {
    id,
    name: original.name,
    description: original.description,
    createdAt: original.createdAt,
    restoredFrom: {
      backupDigest: backup.integrity.digest,
      projectId: original.id,
      importedAt,
    },
  };
  const runs = original.runs.map((originalRun) => {
    const run = structuredClone(originalRun);
    delete run.review;
    run.id = randomUUID();
    run.projectId = id;
    run.importedFrom = {
      runId: originalRun.id,
      specHash: originalRun.specHash,
    };
    run.checks = originalRun.checks.map((c) => ({
      ...structuredClone(c),
      id: randomUUID(),
      source: "imported-operator-declared",
      importedFrom: { checkId: c.id, source: c.source },
    }));
    const ids = new Map(
      originalRun.checks.map((c, i) => [c.id, run.checks[i].id]),
    );
    if (originalRun.acceptances)
      run.acceptances = originalRun.acceptances.map((a) => ({
        ...structuredClone(a),
        id: randomUUID(),
        source: "imported-operator-declared",
        checkIds: a.checkIds.map((id) => ids.get(id)),
      }));
    return run;
  });
  return { project, runs };
}
