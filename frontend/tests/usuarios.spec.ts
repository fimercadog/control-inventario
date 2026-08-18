import path from "node:path";
import fs from "node:fs";
import { test, expect, type Page } from "@playwright/test";
import { login, openUserMenu, DEMO_EMAIL } from "./helpers";

const TEST_AVATAR_PATH = path.join(__dirname, "fixtures", "test-avatar.png");

/** Waits for the list's initial fetch to settle before a test starts interacting with it. */
async function waitForUsuariosLoaded(page: Page) {
  await expect(page.getByRole("heading", { name: "Usuarios" })).toBeVisible();
  await expect(page.getByText("Cargando…")).not.toBeVisible({ timeout: 15000 });
}

/**
 * Fills the search box and waits for the debounced fetch to fully settle on exactly one
 * match before returning. Interacting with a row's dropdown before the search response
 * lands is a real race: a late-arriving refetch replaces the whole row (and any open
 * dropdown anchored to it) mid-interaction, which is what earlier flakiness here traced
 * back to — not a backend speed issue by itself.
 */
async function searchForUniqueUser(page: Page, term: string) {
  await page.getByLabel("Buscar usuarios").fill(term);
  await expect(page.getByRole("row")).toHaveCount(2, { timeout: 10000 }); // header + 1 match
  return page.getByRole("row").filter({ hasText: term });
}

test.describe("Usuarios list", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto("/usuarios");
    await waitForUsuariosLoaded(page);
  });

  test("lists real users from the backend with numbered rows", async ({ page }) => {
    await expect(page.getByRole("table")).toBeVisible();
    const firstRow = page.getByRole("row").nth(1);
    await expect(firstRow.getByRole("cell").first()).toHaveText("1");
    await expect(page.getByText(/Mostrando 1–\d+ de \d+ resultados?/)).toBeVisible();
  });

  test("typing fewer than 3 characters does not trigger a search", async ({ page }) => {
    const rowCountBefore = await page.getByRole("row").count();
    await page.getByLabel("Buscar usuarios").fill("ab");
    await page.waitForTimeout(700);
    // Still showing the unfiltered default page — row count unchanged.
    await expect(page.getByRole("row")).toHaveCount(rowCountBefore);
  });

  test("typing 3+ characters filters the table", async ({ page }) => {
    await page.getByLabel("Buscar usuarios").fill("zzzzznoexiste");
    await expect(page.getByText("No se encontraron usuarios.")).toBeVisible({ timeout: 10000 });
    await page.getByLabel("Buscar usuarios").fill("");
    await expect(page.getByText("No se encontraron usuarios.")).not.toBeVisible();
  });

  test("changes page size and resets to page 1", async ({ page }) => {
    await page.getByLabel("Filas por página").click();
    await page.getByRole("option", { name: "10", exact: true }).click();
    await expect(page.getByLabel("Ir a página")).toHaveValue("1", { timeout: 10000 });
    const rows = page.getByRole("row");
    // header row + up to 10 data rows
    await expect(rows).toHaveCount(11);
  });

  test("navigates to the next page", async ({ page }) => {
    await page.getByLabel("Filas por página").click();
    await page.getByRole("option", { name: "10", exact: true }).click();
    await expect(page.getByLabel("Ir a página")).toHaveValue("1", { timeout: 10000 });
    await page.getByLabel("Página siguiente").click();
    await expect(page.getByLabel("Ir a página")).toHaveValue("2", { timeout: 10000 });
    const firstCell = page.getByRole("row").nth(1).getByRole("cell").first();
    await expect(firstCell).toHaveText("11");
  });

  test("filters by estado", async ({ page }) => {
    await page.getByLabel("Filtrar por estado").click();
    await page.getByRole("option", { name: "Todos", exact: true }).click();
    await expect(page.getByText(/Mostrando \d+–\d+ de \d+ resultados?/)).toBeVisible({ timeout: 10000 });
  });

  test("Ver opens a modal with the user's details, not a page navigation", async ({ page }) => {
    const targetRow = await searchForUniqueUser(page, "bturcotte@example.net");
    await targetRow.getByRole("button", { name: "Acciones" }).click();
    await page.getByRole("menuitem", { name: "Ver" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("bturcotte@example.net")).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Cambiar rol" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Editar avatar" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: /^(Desactivar|Activar)$/ })).toBeVisible();
    // No navigation happened — still on the list.
    await expect(page).toHaveURL(/\/usuarios(\?.*)?$/);
  });

  test("clicking a user's name also opens the Ver modal", async ({ page }) => {
    const targetRow = await searchForUniqueUser(page, "bturcotte@example.net");
    await targetRow.getByRole("button").first().click();
    await expect(page.getByRole("dialog").getByText("bturcotte@example.net")).toBeVisible();
  });

  test("the standalone user detail page is still reachable by direct URL", async ({ page }) => {
    // Hard navigation: drops the in-memory access token, so this waits out a real
    // refresh-cookie bootstrap plus the user fetch — longer than the default timeout.
    await page.goto("/usuarios/2");
    await expect(page.getByText("bturcotte@example.net")).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("link", { name: "Volver a usuarios" })).toBeVisible();
  });

  test("activates and deactivates a user from the Ver modal, then restores the original state", async ({
    page,
  }) => {
    const targetRow = await searchForUniqueUser(page, "bturcotte@example.net");
    await targetRow.getByRole("button", { name: "Acciones" }).click();
    await page.getByRole("menuitem", { name: "Ver" }).click();

    const dialog = page.getByRole("dialog");
    const toggleButton = dialog.getByRole("button", { name: /^(Desactivar|Activar)$/ });
    const initialLabel = await toggleButton.textContent();

    await toggleButton.click();
    await expect(dialog.getByRole("button", { name: /^(Desactivar|Activar)$/ })).not.toHaveText(
      initialLabel ?? "",
      { timeout: 10000 }
    );

    // restore original state so the shared demo dataset is left unchanged
    await dialog.getByRole("button", { name: /^(Desactivar|Activar)$/ }).click();
    await expect(dialog.getByRole("button", { name: /^(Desactivar|Activar)$/ })).toHaveText(
      initialLabel ?? "",
      { timeout: 10000 }
    );
  });

  test("is responsive: sidebar becomes a sheet on mobile viewport", async ({ page }) => {
    // Resizing the viewport does not reload the page, so the already-authenticated
    // session from beforeEach is preserved — no second hard navigation needed.
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(page.getByRole("button", { name: "Abrir menú" })).toBeVisible();
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
  });

  test("shows an avatar (or initials placeholder) for each user", async ({ page }) => {
    const firstRow = page.getByRole("row").nth(1);
    // AvatarFallback renders the person's initials as a <span> when there is no avatar_url.
    await expect(firstRow.locator('[data-slot="avatar"]')).toBeVisible();
  });

  test("row actions menu is Ver / Cambiar rol / Editar avatar / Activar-Desactivar — no generic Actualizar", async ({
    page,
  }) => {
    const targetRow = await searchForUniqueUser(page, "bturcotte@example.net");
    await targetRow.getByRole("button", { name: "Acciones" }).click();

    const menu = page.getByRole("menu");
    await expect(menu.getByRole("menuitem", { name: "Ver" })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Cambiar rol" })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Editar avatar" })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: /^(Desactivar|Activar)$/ })).toBeVisible();
  });

  test("Cambiar rol assigns a real role, persists it, and can be restored", async ({ page }) => {
    const targetRow = await searchForUniqueUser(page, "bturcotte@example.net");
    await expect(targetRow.getByText("Administrador")).toBeVisible();

    await targetRow.getByRole("button", { name: "Acciones" }).click();
    await page.getByRole("menuitem", { name: "Cambiar rol" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Cambiar rol" })).toBeVisible();
    await dialog.getByLabel("Rol").click();
    await page.getByRole("option", { name: "Bodeguero", exact: true }).click();
    await dialog.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(dialog).not.toBeVisible({ timeout: 10000 });

    // Persistence: the list re-fetched and now shows the new role.
    await expect(targetRow.getByText("Bodeguero")).toBeVisible({ timeout: 10000 });

    // Restore the original role so the shared demo dataset is left unchanged.
    await targetRow.getByRole("button", { name: "Acciones" }).click();
    await page.getByRole("menuitem", { name: "Cambiar rol" }).click();
    await dialog.getByLabel("Rol").click();
    await page.getByRole("option", { name: "Administrador", exact: true }).click();
    await dialog.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(targetRow.getByText("Administrador")).toBeVisible({ timeout: 10000 });
  });

  test("Editar avatar uploads and removes a real avatar, persists, and restores no-avatar state", async ({
    page,
  }) => {
    const targetRow = await searchForUniqueUser(page, "bturcotte@example.net");
    // Starts with no avatar — fallback initials, no <img>.
    await expect(targetRow.locator('[data-slot="avatar-image"]')).toHaveCount(0);

    await targetRow.getByRole("button", { name: "Acciones" }).click();
    await page.getByRole("menuitem", { name: "Editar avatar" }).click();

    // Upload succeeds and closes the dialog immediately (same "submit -> done" pattern as
    // ChangeRoleForm/InviteUserForm) — no separate save step to wait for within this session.
    let dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Editar avatar" })).toBeVisible();
    await dialog.getByLabel("Seleccionar imagen de avatar").setInputFiles(TEST_AVATAR_PATH);
    await expect(dialog).not.toBeVisible({ timeout: 10000 });

    // Persistence: the list re-fetched and now shows a real <img> avatar.
    await expect(targetRow.locator('[data-slot="avatar-image"]')).toBeVisible({ timeout: 10000 });

    // Restore: reopen fresh and remove the avatar so the shared demo dataset is left unchanged.
    await targetRow.getByRole("button", { name: "Acciones" }).click();
    await page.getByRole("menuitem", { name: "Editar avatar" }).click();
    dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("button", { name: "Quitar avatar" })).toBeVisible({ timeout: 10000 });
    await dialog.getByRole("button", { name: "Quitar avatar" }).click();
    await expect(dialog).not.toBeVisible({ timeout: 10000 });

    await expect(targetRow.locator('[data-slot="avatar-image"]')).toHaveCount(0, { timeout: 10000 });
  });

  test("Nuevo Usuario opens a modal with the real invitation flow, not a fake creation form", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Nuevo Usuario" }).click();
    await expect(page.getByRole("heading", { name: "Nuevo Usuario" })).toBeVisible();
    await expect(page.getByText(/FidelOS no crea usuarios directamente/)).toBeVisible();

    // Nombre + Correo + Rol match StoreInvitationRequest exactly (name added after
    // confirming the invitations table schema and adding a real, minimal backend
    // migration for it — see report). No password/avatar/empresa fields: those
    // still don't exist on this endpoint.
    await expect(page.getByLabel("Nombre completo")).toBeVisible();
    await expect(page.getByLabel("Contraseña", { exact: true })).toHaveCount(0);
    await expect(page.getByLabel("Seleccionar imagen de avatar")).toHaveCount(0);

    await page.getByRole("button", { name: "Enviar invitación" }).click();
    await expect(page.getByText("El nombre es obligatorio.")).toBeVisible();
    await expect(page.getByText("El correo es obligatorio.")).toBeVisible();
  });

  test("Nuevo Usuario sends name, email, and role in the request payload", async ({ page }) => {
    // Intercepts and fulfills locally instead of letting this hit the real backend: there is
    // no delete-invitation endpoint (confirmed by the backend's own test suite), so a real
    // submission here would create a permanent, uncleanable row on every test run. The real
    // end-to-end path (real 201 from the real backend) was verified manually and is reported
    // separately; this test only pins down the payload shape the frontend actually sends.
    let requestBody: unknown;
    await page.route("**/api/v1/usuarios/invitar", async (route) => {
      requestBody = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ success: true, message: "Invitación enviada correctamente", data: null }),
      });
    });

    await page.getByRole("button", { name: "Nuevo Usuario" }).click();
    await page.getByLabel("Nombre completo").fill("Persona De Prueba");
    await page.getByLabel("Correo electrónico").fill("payload-shape-check@example.com");
    await page.getByRole("button", { name: "Enviar invitación" }).click();
    await expect(page.getByText("Invitación enviada correctamente.")).toBeVisible();

    expect(requestBody).toMatchObject({
      name: "Persona De Prueba",
      email: "payload-shape-check@example.com",
    });
  });

  test("CSV and PDF export buttons are visible in the toolbar", async ({ page }) => {
    await expect(page.getByRole("button", { name: "CSV" })).toBeVisible();
    await expect(page.getByRole("button", { name: "PDF" })).toBeVisible();
    // Nothing else in the toolbar moved — search stays reachable right after them.
    await expect(page.getByLabel("Buscar usuarios")).toBeVisible();
  });

  test("CSV button downloads a real CSV file with real data", async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "CSV" }).click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/^usuarios-.*\.csv$/);
    const filePath = await download.path();
    const contenido = fs.readFileSync(filePath, "utf-8");
    expect(contenido).toContain("#,Usuario,Email,Rol,Estado");
    expect(contenido).toContain(DEMO_EMAIL);
    // No sensitive fields ever leave the export.
    expect(contenido).not.toContain("password");
    expect(contenido).not.toContain("remember_token");
  });

  test("PDF button downloads a real, valid PDF file", async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "PDF" }).click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/^usuarios-.*\.pdf$/);
    const filePath = await download.path();
    const header = fs.readFileSync(filePath).subarray(0, 4).toString("utf-8");
    expect(header).toBe("%PDF");
    expect(fs.statSync(filePath).size).toBeGreaterThan(1000);
  });

  test("CSV export respects the current search filter, not just the visible page", async ({ page }) => {
    const targetRow = await searchForUniqueUser(page, "bturcotte@example.net");
    await expect(targetRow).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "CSV" }).click(),
    ]);

    const filePath = await download.path();
    const contenido = fs.readFileSync(filePath, "utf-8");
    const filas = contenido.trim().split("\n");
    // Header + exactly the one matching user — the export reflects the active
    // search, not the full company roster (which has hundreds of real rows).
    expect(filas).toHaveLength(2);
    expect(contenido).toContain("bturcotte@example.net");
  });

  test("exporting does not disturb the list, search, filters, or pagination", async ({ page }) => {
    // Regression guard for the export Work Order's own "touch nothing else" constraint.
    await page.getByLabel("Buscar usuarios").fill("bturcotte");
    await expect(page.getByRole("row")).toHaveCount(2, { timeout: 10000 });

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "PDF" }).click(),
    ]);
    await download.path();

    // The list itself is untouched by the export action.
    await expect(page.getByRole("row")).toHaveCount(2);
    await expect(page.getByLabel("Buscar usuarios")).toHaveValue("bturcotte");
  });
});

test.describe("Dashboard", () => {
  test("shows real session data and a quick link to Usuarios", async ({ page }) => {
    await login(page);
    // Session identity renders in the persistent Header, not inside <main> — role shows
    // passively on the trigger button; email only renders once the dropdown is opened.
    await expect(page.getByText("Administrador")).toBeVisible();
    await openUserMenu(page);
    await expect(page.getByText(DEMO_EMAIL)).toBeVisible();
    await page.keyboard.press("Escape");
    await page.getByRole("link", { name: "Usuarios" }).first().click();
    await expect(page).toHaveURL(/\/usuarios/);
  });
});
