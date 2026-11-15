import { readFile, stat } from "node:fs/promises";
import { verifyExport } from "../src/backup.mjs";
const path = process.argv[2];
if (!path) {
  console.error("Uso: npm run backup:verify -- caminho/do/backup.json");
  process.exitCode = 2;
} else
  try {
    if ((await stat(path)).size > 64 * 1024 * 1024)
      throw Error("Arquivo excede o limite de leitura de 64 MiB.");
    console.log(
      JSON.stringify(
        verifyExport(JSON.parse(await readFile(path, "utf8"))),
        null,
        2,
      ),
    );
  } catch (e) {
    console.error("Falha na verificação:", e.message);
    process.exitCode = 1;
  }
