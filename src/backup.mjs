import { createHash } from "node:crypto";
import { z } from "zod";
const payloadSchema = z
  .object({
    formatVersion: z.literal(1),
    kind: z.literal("forge-project-export"),
    exportedAt: z.iso.datetime(),
    project: z.object({
      id: z.uuid(),
      name: z.string(),
      description: z.string(),
      createdAt: z.iso.datetime(),
      runs: z.array(z.unknown()),
    }),
  })
  .strict();
const digest = (payload) =>
  createHash("sha256").update(JSON.stringify(payload)).digest("hex");
export function exportProject(project) {
  const payload = payloadSchema.parse({
    formatVersion: 1,
    kind: "forge-project-export",
    exportedAt: new Date().toISOString(),
    project,
  });
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
    !/^\w{64}$/.test(backup?.integrity?.digest ?? "")
  )
    throw Error("Formato de integridade inválido.");
  payloadSchema.parse(backup.payload);
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
