import { test, expect } from "@playwright/test";
test("create project, plan, record evidence, reload and reopen on mobile", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page
    .getByLabel("Nome do projeto", { exact: true })
    .fill("Portal de clientes — teste");
  await page
    .getByLabel("O que você quer construir?")
    .fill("Portal original para acompanhar pedidos de clientes.");
  await page.getByRole("button", { name: "Criar projeto" }).click();
  await expect(page.locator("#detail-name")).toHaveText(
    "Portal de clientes — teste",
  );
  await page
    .getByLabel("Objetivo da tarefa")
    .fill("Criar login, cadastro de dados e painel com relatórios.");
  await page.getByLabel("Limite para a tarefa (R$)").fill("25.50");
  await page.getByRole("button", { name: "Gerar plano local" }).click();
  await expect(
    page.getByText("Aguardando evidências", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/Plano determinístico por palavras-chave/),
  ).toBeVisible();
  for (const gate of ["functional", "visual", "data-isolation"]) {
    await page.getByLabel("Critério", { exact: true }).selectOption(gate);
    await page
      .getByLabel("Registro da verificação")
      .fill(`Registro manual de teste isolado para o critério ${gate}.`);
    await page.getByRole("button", { name: "Adicionar evidência" }).click();
    await expect(
      page.locator(".evidence-item").filter({
        hasText: `Registro manual de teste isolado para o critério ${gate}.`,
      }),
    ).toBeVisible();
  }
  await expect(
    page.getByText("Pronto para revisão humana", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Aceitar revisão", exact: true })
    .click();
  await expect(page.getByText("Revisão aceita", { exact: true })).toBeVisible();
  await page.getByLabel("Critério", { exact: true }).selectOption("functional");
  await page.getByLabel("Resultado declarado").selectOption("fail");
  await page
    .getByLabel("Registro da verificação")
    .fill("Uma regressão foi observada na última revisão manual.");
  await page.getByRole("button", { name: "Adicionar evidência" }).click();
  await expect(
    page.getByText("Aguardando evidências", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Todos os projetos" }).click();
  await page.reload();
  await page
    .getByRole("button", { name: /Portal de clientes — teste/ })
    .click();
  await expect(
    page.locator(".evidence-item").filter({
      hasText: "Uma regressão foi observada na última revisão manual.",
    }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/studio-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Todos os projetos" }).click();
  await expect(
    page.getByRole("button", { name: /Portal de clientes — teste/ }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/studio-mobile.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("project names render as text rather than executable markup", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByLabel("Nome do projeto", { exact: true })
    .fill("<img src=x onerror=alert(1)>");
  await page.getByRole("button", { name: "Criar projeto" }).click();
  await expect(page.locator("#detail-name")).toHaveText(
    "<img src=x onerror=alert(1)>",
  );
  expect(await page.locator("#detail-name img").count()).toBe(0);
});

test("project backup can be downloaded and verified independently", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByLabel("Nome do projeto", { exact: true })
    .fill("Projeto exportável");
  await page.getByRole("button", { name: "Criar projeto" }).click();
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("link", { name: "Exportar backup do projeto" }).click();
  const download = await downloadEvent;
  const { readFile } = await import("node:fs/promises");
  const { verifyExport } = await import("../src/backup.mjs");
  const backup = JSON.parse(await readFile(await download.path(), "utf8"));
  expect(verifyExport(backup).valid).toBe(true);
  expect(backup.payload.project.name).toBe("Projeto exportável");
});

test("downloaded backup restores through file picker without losing the original", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByLabel("Nome do projeto", { exact: true })
    .fill("Recuperação pelo navegador");
  await page.getByRole("button", { name: "Criar projeto" }).click();
  await page
    .getByLabel("Objetivo da tarefa")
    .fill("Um painel com login e cadastro de dados.");
  await page.getByRole("button", { name: "Gerar plano local" }).click();
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("link", { name: "Exportar backup do projeto" }).click();
  const file = await (await downloadEvent).path();
  await page.getByRole("button", { name: "Todos os projetos" }).click();
  await page
    .getByText("Restaurar um projeto de backup", { exact: true })
    .click();
  await page
    .getByLabel("Arquivo de backup JSON (até 2 MiB)")
    .setInputFiles(file);
  await page.getByRole("button", { name: "Restaurar como nova cópia" }).click();
  await expect(page.locator("#notice")).toContainText(
    "Backup restaurado em uma nova cópia",
  );
  await expect(
    page.getByText("Aguardando evidências", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Todos os projetos" }).click();
  await expect(
    page.getByRole("button", { name: /Recuperação pelo navegador/ }),
  ).toHaveCount(2);
});
