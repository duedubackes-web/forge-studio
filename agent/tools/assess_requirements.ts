import { defineTool } from "eve/tools";
import { z } from "zod";
export default defineTool({
  description:
    "Review requirements without executing code, scanning a remote service, publishing or spending the configured budget.",
  inputSchema: z.object({
    goal: z.string().min(12).max(6000),
    acceptanceCriteria: z.array(z.string().min(5).max(500)).min(1).max(20),
    usesProductionData: z.boolean(),
    budgetCents: z.number().int().nonnegative().max(1000000),
  }),
  execute(input) {
    return {
      kind: "requirements-review",
      goal: input.goal,
      criteria: input.acceptanceCriteria.map((text) => ({
        text,
        verification: "not-run",
      })),
      budget: {
        limitCents: input.budgetCents,
        currency: "BRL",
        spentCents: 0,
        scope: "configuration-only",
      },
      blockers: input.usesProductionData
        ? ["Prepare isolated synthetic data before testing."]
        : [],
      limitations: [
        "Does not inspect a repository or execute tests.",
        "Local Studio and eve agent are separate processes; no live integration is configured.",
      ],
    };
  },
});
