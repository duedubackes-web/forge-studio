import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { ZodError } from "zod";
import { Store } from "./store.mjs";
import { exportProject } from "./backup.mjs";
const publicDir = fileURLToPath(new URL("../public/", import.meta.url));
const assets = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/app.js", ["app.js", "text/javascript; charset=utf-8"]],
  ["/style.css", ["style.css", "text/css; charset=utf-8"]],
]);
function send(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}
async function body(req, maxBytes = 16384) {
  if (req.headers["content-type"]?.split(";")[0] !== "application/json")
    throw Object.assign(Error("Use application/json."), { status: 415 });
  let bytes = 0;
  const chunks = [];
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > maxBytes)
      throw Object.assign(Error(`Solicitação excede ${maxBytes} bytes.`), {
        status: 413,
      });
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw Object.assign(Error("JSON inválido."), { status: 400 });
  }
}
export function createApp({ dataPath }) {
  const store = new Store(dataPath);
  return createServer(async (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
    );
    try {
      if (!/^(127\.0\.0\.1|localhost):\d+$/.test(req.headers.host ?? ""))
        return send(res, 403, { error: "Host não permitido." });
      const origin = `http://${req.headers.host}`;
      if (req.headers.origin && req.headers.origin !== origin)
        return send(res, 403, { error: "Origem não permitida." });
      const path = new URL(req.url, origin).pathname;
      if (req.method === "GET" && assets.has(path)) {
        const [name, type] = assets.get(path);
        res.writeHead(200, {
          "Content-Type": type,
          "Cache-Control": "no-cache",
        });
        return res.end(await readFile(resolve(publicDir, name)));
      }
      if (req.method === "GET" && path === "/api/health")
        return send(res, 200, {
          status: "ok",
          mode: "local-prototype",
          aiConnected: false,
        });
      if (path === "/api/projects/import" && req.method === "POST") {
        let backup = await body(req, 2 * 1024 * 1024);
        try {
          return send(res, 201, store.restore(backup));
        } catch (error) {
          if (error instanceof ZodError) throw error;
          if (error.code) throw error;
          return send(res, 400, { error: error.message });
        }
      }
      if (path === "/api/projects") {
        if (req.method === "GET") return send(res, 200, store.list());
        if (req.method === "POST")
          return send(res, 201, store.addProject(await body(req)));
      }
      const backup = path.match(/^\/api\/projects\/([a-f0-9-]+)\/export$/);
      if (backup && req.method === "GET") {
        const project = store.project(backup[1]);
        if (!project)
          return send(res, 404, { error: "Projeto não encontrado." });
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="forge-project-${project.id}.json"`,
        );
        return send(res, 200, exportProject(project));
      }
      const project = path.match(/^\/api\/projects\/([a-f0-9-]+)$/);
      if (project && req.method === "GET") {
        const result = store.project(project[1]);
        return send(
          res,
          result ? 200 : 404,
          result ?? { error: "Projeto não encontrado." },
        );
      }
      const runs = path.match(/^\/api\/projects\/([a-f0-9-]+)\/runs$/);
      if (runs && req.method === "POST") {
        const result = store.addRun(runs[1], await body(req));
        return send(
          res,
          result ? 201 : 404,
          result ?? { error: "Projeto não encontrado." },
        );
      }
      const acceptance = path.match(
        /^\/api\/projects\/([a-f0-9-]+)\/runs\/([a-f0-9-]+)\/accept$/,
      );
      if (acceptance && req.method === "POST") {
        const result = store.accept(
          acceptance[1],
          acceptance[2],
          await body(req),
        );
        return send(
          res,
          result ? 200 : 404,
          result ?? { error: "Execução não encontrada neste projeto." },
        );
      }
      const checks = path.match(
        /^\/api\/projects\/([a-f0-9-]+)\/runs\/([a-f0-9-]+)\/checks$/,
      );
      if (checks && req.method === "POST") {
        const result = store.addCheck(checks[1], checks[2], await body(req));
        return send(
          res,
          result ? 201 : 404,
          result ?? { error: "Execução não encontrada neste projeto." },
        );
      }
      return send(res, 404, { error: "Recurso não encontrado." });
    } catch (error) {
      if (error instanceof ZodError)
        return send(res, 400, {
          error: "Confira os campos enviados.",
          fields: error.issues.map((i) => ({
            path: i.path,
            message: i.message,
          })),
        });
      if (error.status)
        return send(res, error.status, { error: error.message });
      console.error("Request failed:", error.name);
      return send(res, 500, { error: "Não foi possível concluir a operação." });
    }
  });
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const port = Number(process.env.PORT ?? 4173);
  createApp({
    dataPath: resolve(process.env.FORGE_DATA_PATH ?? ".data/store.json"),
  }).listen(port, "127.0.0.1", () =>
    console.log(
      `Forge Studio: http://127.0.0.1:${port} (protótipo local, sem IA conectada)`,
    ),
  );
}
