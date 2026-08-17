import { test, expect, type Page } from "@playwright/test";
import { login, DEMO_EMAIL } from "./helpers";

/** Waits for the list's initial fetch to settle before a test starts interacting with it. */
async function waitForUsuariosLoaded(page: Page) {
  await expect(page.getByRole("heading", { name: "Usuarios" })).toBeVisible();
  await expect(page.getByText("Cargando…")).not.toBeVisible({ timeout: 15000 });
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
    await expect(page.getByText(/resultados? · página 1 de/)).toBeVisible();
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
    await expect(page.getByText(/· página 1 de/)).toBeVisible({ timeout: 10000 });
    const rows = page.getByRole("row");
    // header row + up to 10 data rows
    await expect(rows).toHaveCount(11);
  });

  test("navigates to the next page", async ({ page }) => {
    await page.getByLabel("Filas por página").click();
    await page.getByRole("option", { name: "10", exact: true }).click();
    await expect(page.getByText(/· página 1 de/)).toBeVisible({ timeout: 10000 });
    await page.getByLabel("Página siguiente").click();
    await expect(page.getByText(/· página 2 de/)).toBeVisible({ timeout: 10000 });
    const firstCell = page.getByRole("row").nth(1).getByRole("cell").first();
    await expect(firstCell).toHaveText("11");
  });

  test("filters by estado", async ({ page }) => {
    await page.getByLabel("Filtrar por estado").click();
    await page.getByRole("option", { name: "Todos", exact: true }).click();
    await expect(page.getByText(/resultados? · página/)).toBeVisible({ timeout: 10000 });
  });

  test("opens a user detail page", async ({ page }) => {
    await page.getByRole("row").nth(1).getByRole("link").click();
    await expect(page).toHaveURL(/\/usuarios\/\d+/);
    await expect(page.getByText("Email", { exact: true })).toBeVisible();
    await expect(page.getByText("Rol", { exact: true })).toBeVisible();
  });

  test("activates and deactivates a user, then restores the original state", async ({ page }) => {
    // Client-side navigation via search + row click — avoids a hard page.goto(), which would
    // drop the in-memory access token and force a refresh-token rotation mid-test (see helpers).
    await page.getByLabel("Buscar usuarios").fill("bturcotte@example.net");
    const targetRow = page.getByRole("row").filter({ hasText: "bturcotte@example.net" });
    await targetRow.getByRole("link").click();
    await expect(page).toHaveURL(/\/usuarios\/2$/);

    const toggleButton = page.getByRole("button", { name: /Desactivar usuario|Activar usuario/ });
    const initialLabel = await toggleButton.textContent();

    await toggleButton.click();
    await expect(page.getByRole("button", { name: /Desactivar usuario|Activar usuario/ })).not.toHaveText(
      initialLabel ?? ""
    );

    // restore original state so the shared demo dataset is left unchanged
    await page.getByRole("button", { name: /Desactivar usuario|Activar usuario/ }).click();
    await expect(page.getByRole("button", { name: /Desactivar usuario|Activar usuario/ })).toHaveText(
      initialLabel ?? ""
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

  test("Actualizar opens a per-user edit modal with operational fields only", async ({ page }) => {
    await page.getByLabel("Buscar usuarios").fill("bturcotte@example.net");
    const targetRow = page.getByRole("row").filter({ hasText: "bturcotte@example.net" });
    await targetRow.getByRole("button", { name: "Actualizar" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Actualizar usuario" })).toBeVisible();
    // Identity fields are shown as read-only context, never as editable inputs.
    await expect(dialog.getByText("bturcotte@example.net")).toBeVisible();
    await expect(page.getByLabel("Correo electrónico")).toHaveCount(0);
    await expect(page.getByLabel("Nombre")).toHaveCount(0);
    // Only the real operational fields are editable.
    await expect(page.getByLabel("Tema")).toBeVisible();
    await expect(page.getByLabel("Idioma")).toBeVisible();
    const timezoneInput = page.getByLabel("Zona horaria");
    await expect(timezoneInput).toBeVisible();

    const originalTimezone = await timezoneInput.inputValue();
    const newTimezone =
      originalTimezone === "America/Bogota" ? "America/Mexico_City" : "America/Bogota";

    await timezoneInput.fill(newTimezone);
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByRole("heading", { name: "Actualizar usuario" })).not.toBeVisible({
      timeout: 10000,
    });

    // Persistence: reopen the same user and confirm the change actually landed on the backend.
    await targetRow.getByRole("button", { name: "Actualizar" }).click();
    await expect(page.getByLabel("Zona horaria")).toHaveValue(newTimezone, { timeout: 10000 });

    // Restore the original value so the shared demo dataset is left unchanged.
    await page.getByLabel("Zona horaria").fill(originalTimezone);
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByRole("heading", { name: "Actualizar usuario" })).not.toBeVisible({
      timeout: 10000,
    });
  });

  test("Nuevo Usuario opens a modal with the real invitation flow, not a fake creation form", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Nuevo Usuario" }).click();
    await expect(page.getByRole("heading", { name: "Nuevo Usuario" })).toBeVisible();
    await expect(page.getByText(/FidelOS no crea usuarios directamente/)).toBeVisible();

    await page.getByRole("button", { name: "Enviar invitación" }).click();
    await expect(page.getByText("El correo es obligatorio.")).toBeVisible();
  });
});

test.describe("Dashboard", () => {
  test("shows real session data and a quick link to Usuarios", async ({ page }) => {
    await login(page);
    const main = page.getByRole("main");
    await expect(main.getByText(DEMO_EMAIL)).toBeVisible();
    await expect(main.getByText("Administrador")).toBeVisible();
    await page.getByRole("link", { name: "Usuarios" }).first().click();
    await expect(page).toHaveURL(/\/usuarios/);
  });
});
