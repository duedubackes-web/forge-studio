const $ = (selector) => document.querySelector(selector);
const state = { project: null };
const money = (cents) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    cents / 100,
  );
function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === "className") node.className = value;
    else if (key.startsWith("on"))
      node.addEventListener(key.slice(2).toLowerCase(), value);
    else node.setAttribute(key, value);
  }
  for (const child of children.flat()) {
    if (child != null)
      node.append(
        child instanceof Node ? child : document.createTextNode(String(child)),
      );
  }
  return node;
}
function notify(message) {
  $("#notice").textContent = message;
  $("#notice").hidden = false;
}
async function api(path, data) {
  const res = await fetch(path, {
    method: data ? "POST" : "GET",
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  });
  const result = await res.json();
  if (!res.ok) throw Error(result.error ?? "Falha na operação.");
  return result;
}
async function submit(form, work) {
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  $("#notice").hidden = true;
  try {
    await work();
  } catch (error) {
    notify(error.message);
  } finally {
    button.disabled = false;
  }
}
async function loadProjects() {
  const projects = await api("/api/projects");
  $("#project-count").textContent = projects.length;
  const list = $("#project-list");
  list.replaceChildren();
  if (!projects.length)
    list.append(
      el(
        "div",
        { className: "empty" },
        "Seu próximo produto começa aqui. Crie o primeiro projeto acima.",
      ),
    );
  for (const project of projects)
    list.append(
      el(
        "button",
        {
          className: "project-card",
          type: "button",
          onClick: () =>
            openProject(project.id).catch((e) => notify(e.message)),
        },
        el("span", { className: "project-icon", "aria-hidden": "true" }, "▧"),
        el("strong", {}, project.name),
        el(
          "p",
          {},
          project.description.slice(0, 120) ||
            "Pronto para receber a primeira ideia.",
        ),
        el(
          "small",
          {},
          new Date(project.createdAt).toLocaleDateString("pt-BR"),
        ),
      ),
    );
}
function home() {
  state.project = null;
  $("#home").hidden = false;
  $("#project-view").hidden = true;
  $("#breadcrumb").textContent = "Projetos";
  loadProjects().catch((e) => notify(e.message));
}
async function openProject(id) {
  state.project = await api(`/api/projects/${id}`);
  $("#home").hidden = true;
  $("#project-view").hidden = false;
  $("#breadcrumb").textContent = state.project.name;
  $("#detail-name").textContent = state.project.name;
  $("#export-project").href = `/api/projects/${state.project.id}/export`;
  $("#detail-description").textContent = state.project.description;
  renderRuns();
}
function renderRuns() {
  const list = $("#run-list");
  list.replaceChildren();
  if (!state.project.runs.length) {
    list.append(
      el(
        "div",
        { className: "empty" },
        "Nenhum plano ainda. Descreva a primeira mudança para começar.",
      ),
    );
    return;
  }
  for (const run of [...state.project.runs].reverse()) {
    const ready = run.review.status === "ready-for-human-review";
    const card = el(
      "article",
      { className: "run-card" },
      el(
        "span",
        { className: `review-badge${ready ? " ready" : ""}` },
        run.review.accepted
          ? "Revisão aceita"
          : ready
            ? "Pronto para revisão humana"
            : "Aguardando evidências",
      ),
      el("h3", {}, run.plan.prompt),
      el("p", { className: "disclosure" }, run.plan.disclosure),
      el(
        "div",
        { className: "run-meta" },
        `Limite configurado: ${money(run.plan.budgetCents)} · Gasto: ${money(run.spentCents)}`,
      ),
    );
    for (const feature of run.plan.features)
      card.append(
        el(
          "div",
          { className: "feature" },
          el("strong", {}, feature.title),
          el("small", {}, feature.acceptance),
        ),
      );
    card.append(
      el(
        "ol",
        {},
        run.plan.tasks.map((task) =>
          el(
            "li",
            {},
            el("strong", {}, task.title),
            el("small", {}, task.detail),
          ),
        ),
      ),
    );
    card.append(
      el(
        "p",
        { className: "spec-hash" },
        `Especificação SHA-256: ${run.specHash}`,
      ),
    );
    card.append(el("p", { className: "hint" }, run.review.assurance));
    const gateId = `gate-${run.id}`,
      outcomeId = `outcome-${run.id}`,
      evidenceId = `evidence-${run.id}`;
    const gate = el(
      "select",
      { id: gateId, name: "gate" },
      run.plan.requiredGates.map((g) => el("option", { value: g.id }, g.label)),
    );
    const outcome = el(
      "select",
      { id: outcomeId, name: "outcome" },
      el("option", { value: "pass" }, "Aprovado pelo operador"),
      el("option", { value: "fail" }, "Falha observada"),
    );
    const evidence = el("textarea", {
      id: evidenceId,
      name: "evidence",
      minlength: "12",
      maxlength: "2000",
      required: "",
      rows: "3",
      placeholder:
        "Descreva como verificou, o resultado e a referência do artefato. Sem dados pessoais ou segredos.",
    });
    const form = el(
      "form",
      { className: "gate-form" },
      el("h3", {}, "Registrar evidência manual"),
      el(
        "div",
        { className: "row" },
        el("div", {}, el("label", { for: gateId }, "Critério"), gate),
        el(
          "div",
          {},
          el("label", { for: outcomeId }, "Resultado declarado"),
          outcome,
        ),
      ),
      el("label", { for: evidenceId }, "Registro da verificação"),
      evidence,
      el(
        "button",
        { type: "submit", className: "primary" },
        "Adicionar evidência ↗",
      ),
    );
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submit(form, async () => {
        await api(`/api/projects/${state.project.id}/runs/${run.id}/checks`, {
          gate: gate.value,
          outcome: outcome.value,
          evidence: evidence.value,
        });
        await openProject(state.project.id);
      });
    });
    if (ready && !run.review.accepted) {
      const acceptButton = el(
        "button",
        { type: "button", className: "primary" },
        "Aceitar revisão",
      );
      acceptButton.addEventListener("click", async () => {
        acceptButton.disabled = true;
        try {
          await api(`/api/projects/${state.project.id}/runs/${run.id}/accept`, {
            expectedSpecHash: run.specHash,
            expectedCheckIds: run.review.currentCheckIds,
          });
          await openProject(state.project.id);
        } catch (error) {
          notify(error.message);
          acceptButton.disabled = false;
        }
      });
      card.append(
        el(
          "p",
          { className: "hint" },
          "O aceite registra sua revisão manual. Não executa testes nem publica o aplicativo.",
        ),
        acceptButton,
      );
    }
    if (run.review.accepted)
      card.append(
        el(
          "p",
          { className: "hint" },
          `Aceite manual registrado em ${new Date(run.review.acceptedAt).toLocaleString("pt-BR")}.`,
        ),
      );
    card.append(form);
    for (const check of [...run.checks].reverse())
      card.append(
        el(
          "div",
          { className: "evidence-item" },
          el(
            "strong",
            {},
            `${check.outcome === "pass" ? "✓" : "!"} ${run.plan.requiredGates.find((g) => g.id === check.gate)?.label ?? check.gate} · ${check.source === "imported-operator-declared" ? "Importada; exige revisão" : "Declaração manual"}`,
          ),
          check.evidence,
        ),
      );
    list.append(card);
  }
}
$("#create-project").addEventListener("submit", (event) => {
  event.preventDefault();
  submit(event.currentTarget, async () => {
    const project = await api("/api/projects", {
      name: $("#project-name").value,
      description: $("#project-description").value,
    });
    $("#create-project").reset();
    await openProject(project.id);
  });
});
$("#create-run").addEventListener("submit", (event) => {
  event.preventDefault();
  submit(event.currentTarget, async () => {
    await api(`/api/projects/${state.project.id}/runs`, {
      prompt: $("#run-prompt").value,
      budgetCents: Math.round(Number($("#budget").value) * 100),
    });
    $("#run-prompt").value = "";
    await openProject(state.project.id);
  });
});
$("#back").addEventListener("click", home);
$("#projects-nav").addEventListener("click", home);
loadProjects().catch((e) => notify(e.message));

$("#restore-project").addEventListener("submit", (event) => {
  event.preventDefault();
  submit(event.currentTarget, async () => {
    const file = $("#backup-file").files[0];
    if (!file || file.size > 2 * 1024 * 1024)
      throw Error("Selecione um backup JSON de até 2 MiB.");
    let backup;
    try {
      backup = JSON.parse(await file.text());
    } catch {
      throw Error("O arquivo não contém JSON válido.");
    }
    const project = await api("/api/projects/import", backup);
    $("#restore-project").reset();
    await openProject(project.id);
    notify(
      "Backup restaurado em uma nova cópia. Revise novamente os critérios antes de aprovar.",
    );
  });
});
