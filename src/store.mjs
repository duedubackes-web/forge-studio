import { mkdirSync, readFileSync, writeFileSync, renameSync } from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import {
  projectInput,
  createRun,
  checkInput,
  reviewStatus,
} from "./domain.mjs";
import { restoreProject } from "./backup.mjs";
import { z } from "zod";
export class Store {
  constructor(path) {
    this.path = path;
    try {
      this.state = JSON.parse(readFileSync(path, "utf8"));
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
      this.state = { version: 1, projects: [], runs: [] };
    }
    if (
      this.state.version !== 1 ||
      !Array.isArray(this.state.projects) ||
      !Array.isArray(this.state.runs)
    )
      throw Error("Unsupported store format");
  }
  save(next) {
    mkdirSync(dirname(this.path), { recursive: true, mode: 0o700 });
    const temp = `${this.path}.${randomUUID()}.tmp`;
    writeFileSync(temp, JSON.stringify(next, null, 2), { mode: 0o600 });
    renameSync(temp, this.path);
    this.state = next;
  }
  list() {
    return structuredClone(this.state.projects);
  }
  project(id) {
    const p = this.state.projects.find((p) => p.id === id);
    return p
      ? structuredClone({
          ...p,
          runs: this.state.runs
            .filter((r) => r.projectId === id)
            .map((r) => ({ ...r, review: reviewStatus(r) })),
        })
      : null;
  }
  restore(backup) {
    const { project, runs } = restoreProject(backup);
    this.save({
      ...this.state,
      projects: [...this.state.projects, project],
      runs: [...this.state.runs, ...runs],
    });
    return this.project(project.id);
  }
  addProject(input) {
    const p = {
      id: randomUUID(),
      ...projectInput.parse(input),
      createdAt: new Date().toISOString(),
    };
    this.save({ ...this.state, projects: [...this.state.projects, p] });
    return structuredClone(p);
  }
  addRun(id, input) {
    if (!this.project(id)) return null;
    const r = createRun(id, input);
    this.save({ ...this.state, runs: [...this.state.runs, r] });
    return { ...structuredClone(r), review: reviewStatus(r) };
  }
  accept(projectId, runId, input) {
    const request = z
      .object({
        expectedSpecHash: z.string().regex(/^[a-f0-9]{64}$/),
        expectedCheckIds: z.array(z.uuid()).length(3),
      })
      .strict()
      .parse(input);
    const run = this.state.runs.find(
      (r) => r.id === runId && r.projectId === projectId,
    );
    if (!run) return null;
    const review = reviewStatus(run);
    if (
      review.missing.length ||
      request.expectedSpecHash !== run.specHash ||
      !request.expectedCheckIds.every(
        (id, i) => id === review.currentCheckIds[i],
      )
    )
      throw Object.assign(
        Error(
          "A revisão mudou ou tem critérios pendentes. Atualize o projeto antes de aceitar.",
        ),
        { status: 409 },
      );
    if (review.accepted) return { ...structuredClone(run), review };
    const acceptance = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      source: "operator-declared",
      specHash: run.specHash,
      checkIds: review.currentCheckIds,
    };
    const next = {
      ...run,
      acceptances: [...(run.acceptances ?? []), acceptance],
    };
    this.save({
      ...this.state,
      runs: this.state.runs.map((r) => (r.id === runId ? next : r)),
    });
    return { ...structuredClone(next), review: reviewStatus(next) };
  }
  addCheck(projectId, runId, input) {
    const r = this.state.runs.find(
      (r) => r.id === runId && r.projectId === projectId,
    );
    if (!r) return null;
    const c = {
      id: randomUUID(),
      ...checkInput.parse(input),
      source: "operator-declared",
      specHash: r.specHash,
      createdAt: new Date().toISOString(),
    };
    const next = { ...r, checks: [...r.checks, c] };
    this.save({
      ...this.state,
      runs: this.state.runs.map((r) => (r.id === runId ? next : r)),
    });
    return { ...structuredClone(next), review: reviewStatus(next) };
  }
}
