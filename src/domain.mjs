import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
export const projectInput = z
  .object({
    name: z.string().trim().min(2).max(80),
    description: z.string().trim().max(2000).default(""),
  })
  .strict();
export const runInput = z
  .object({
    prompt: z.string().trim().min(12).max(6000),
    budgetCents: z.number().int().min(0).max(1000000),
  })
  .strict();
export const checkInput = z
  .object({
    gate: z.enum(["functional", "visual", "data-isolation"]),
    outcome: z.enum(["pass", "fail"]),
    evidence: z.string().trim().min(12).max(2000),
  })
  .strict();
export const gates = [
  {
    id: "functional",
    label: "Fluxos funcionais",
    requirement: "Registrar cenário, resultado esperado e observado.",
  },
  {
    id: "visual",
    label: "Interface e acessibilidade",
    requirement: "Comparar telas e verificar navegação por teclado.",
  },
  {
    id: "data-isolation",
    label: "Isolamento de dados",
    requirement: "Comprovar que testes não alteraram dados de produção.",
  },
];
export function planRequirements(raw) {
  const { prompt, budgetCents } = runInput.parse(raw),
    text = prompt.toLocaleLowerCase("pt-BR");
  const features = [
    [
      "identity",
      /login|usu[aá]ri|autentic|conta|acesso/,
      "Identidade e permissões",
      "Testar acesso permitido, negado e encerramento de sessão.",
    ],
    [
      "data",
      /banco|dados|cadastro|salvar|registro/,
      "Persistência de dados",
      "Validar gravação, leitura e segregação dos dados de teste.",
    ],
    [
      "billing",
      /pagamento|assinatura|cobrança|checkout/,
      "Cobrança",
      "Usar ambiente de teste e verificar repetição sem duplicação.",
    ],
    [
      "dashboard",
      /dashboard|painel|métrica|relat[oó]rio/,
      "Painel e relatórios",
      "Verificar filtros, estados vazios e origem dos números.",
    ],
    [
      "canvas",
      /canvas|jogo|3d|mapa/,
      "Interação gráfica",
      "Instrumentar estados; cliques em DOM não comprovam comportamento do canvas.",
    ],
  ]
    .filter(([, matcher]) => matcher.test(text))
    .map(([id, , title, acceptance]) => ({
      id,
      title,
      acceptance,
      status: "proposed",
    }));
  return {
    engine: "local-rules-v1",
    disclosure:
      "Plano determinístico por palavras-chave. Sem chamada de IA, geração de aplicativo ou execução de testes.",
    prompt,
    budgetCents,
    currency: "BRL",
    features,
    tasks: [
      {
        title: "Definir critérios de aceitação",
        detail: "Confirmar requisitos, fluxos principais e casos de erro.",
      },
      {
        title: "Preparar ambiente separado",
        detail: "Usar dados sintéticos e versões de dependências registradas.",
      },
      {
        title: "Implementar em uma branch",
        detail: "Manter alterações revisáveis e registrar o commit analisado.",
      },
      {
        title: "Verificar e registrar evidências",
        detail: "Validar os três critérios antes de solicitar revisão.",
      },
    ],
    requiredGates: gates,
  };
}
export function createRun(projectId, input) {
  const plan = planRequirements(input);
  return {
    id: randomUUID(),
    projectId,
    createdAt: new Date().toISOString(),
    specHash: createHash("sha256").update(JSON.stringify(plan)).digest("hex"),
    plan,
    checks: [],
    spentCents: 0,
    reservedCents: 0,
  };
}
export function reviewStatus(run) {
  const latest = new Map(run.checks.map((c) => [c.gate, c]));
  const missing = gates
    .filter((g) => {
      const check = latest.get(g.id);
      return (
        check?.outcome !== "pass" ||
        check?.source !== "operator-declared" ||
        check?.specHash !== run.specHash
      );
    })
    .map((g) => g.id);
  const checkIds = gates.map((g) => latest.get(g.id)?.id ?? null);
  const acceptance = missing.length
    ? undefined
    : [...(run.acceptances ?? [])]
        .reverse()
        .find(
          (a) =>
            a.source === "operator-declared" &&
            a.specHash === run.specHash &&
            a.checkIds.length === checkIds.length &&
            a.checkIds.every((id, i) => id === checkIds[i]),
        );
  return {
    accepted: Boolean(acceptance),
    acceptedAt: acceptance?.createdAt ?? null,
    currentCheckIds: checkIds,
    status: missing.length ? "needs-evidence" : "ready-for-human-review",
    missing,
    assurance:
      "Evidências declaradas pelo operador; não verificadas automaticamente. Este protótipo não publica aplicativos.",
  };
}
// Reserve maximum cost before paid work. This module never calls a provider.
export function reserveBudget(ledger, operationId, amountCents) {
  if (!operationId || !Number.isSafeInteger(amountCents) || amountCents < 0)
    throw Error("Invalid reservation");
  if (Object.hasOwn(ledger.reservations, operationId)) {
    if (ledger.reservations[operationId] !== amountCents)
      throw Error("Reservation conflict");
    return ledger;
  }
  const reserved = Object.values(ledger.reservations).reduce(
    (s, v) => s + v,
    0,
  );
  if (amountCents > ledger.limitCents - ledger.spentCents - reserved)
    throw Error("Budget exceeded");
  return {
    ...ledger,
    reservations: { ...ledger.reservations, [operationId]: amountCents },
  };
}
export function settleBudget(ledger, operationId, actualCents) {
  if (!Object.hasOwn(ledger.reservations, operationId))
    throw Error("Unknown reservation");
  if (
    !Number.isSafeInteger(actualCents) ||
    actualCents < 0 ||
    actualCents > ledger.reservations[operationId]
  )
    throw Error("Invalid settlement");
  const reservations = { ...ledger.reservations };
  delete reservations[operationId];
  return {
    ...ledger,
    reservations,
    spentCents: ledger.spentCents + actualCents,
  };
}
