import { spawnSync } from "node:child_process";
import { realpathSync } from "node:fs";
import { createHash } from "node:crypto";
export function inspectRepository(path) {
  let cwd = realpathSync(path);
  function git(args, allowed = [0]) {
    const result = spawnSync(
      "git",
      [
        "--no-optional-locks",
        "-c",
        "core.fsmonitor=false",
        "-c",
        "core.hooksPath=/dev/null",
        ...args,
      ],
      {
        cwd,
        shell: false,
        encoding: "utf8",
        timeout: 10000,
        maxBuffer: 2 * 1024 * 1024,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    if (result.error)
      throw Error(
        `Não foi possível inspecionar Git: ${result.error.code ?? "falha de execução"}.`,
      );
    if (!allowed.includes(result.status))
      throw Error("O caminho não é um repositório Git de trabalho acessível.");
    return { text: result.stdout, status: result.status };
  }
  if (git(["rev-parse", "--is-inside-work-tree"]).text.trim() !== "true")
    throw Error("É necessário um repositório com diretório de trabalho.");
  cwd = realpathSync(
    git(["rev-parse", "--show-toplevel"]).text.replace(/\n$/, ""),
  );
  const commit =
    git(["rev-parse", "--verify", "--quiet", "HEAD"], [0, 1]).text.trim() ||
    null;
  const branch =
    git(["symbolic-ref", "--quiet", "--short", "HEAD"], [0, 1]).text.trim() ||
    null;
  const status = git([
    "status",
    "--porcelain=v1",
    "-z",
    "--untracked-files=normal",
    "--ignore-submodules=all",
  ]).text;
  const tokens = status.split("\0"),
    changes = [];
  for (let i = 0; i < tokens.length; i++) {
    const entry = tokens[i];
    if (!entry) continue;
    const code = entry.slice(0, 2),
      path = entry.slice(3);
    const change = { code, path };
    if (/[RC]/.test(code)) change.previousPath = tokens[++i];
    changes.push(change);
  }
  const tracked = git(["ls-files", "-z"])
    .text.split("\0")
    .filter(Boolean).length;
  const clean = changes.length === 0;
  const metadata = { commit, branch, clean, trackedFiles: tracked, changes };
  return {
    schemaVersion: 1,
    kind: "repository-baseline",
    observedAt: new Date().toISOString(),
    ...metadata,
    metadataSha256: createHash("sha256")
      .update(JSON.stringify(metadata))
      .digest("hex"),
    readyForCommitVerification: Boolean(commit && clean),
    limitations: [
      "Somente metadados Git; não lê nem copia conteúdos de arquivos.",
      "O hash identifica metadados, não o conteúdo completo de alterações locais.",
      "Submódulos não são inspecionados. Arquivos ignorados não aparecem no status.",
      "Não executa testes, código do projeto, rede ou alterações Git.",
    ],
  };
}
