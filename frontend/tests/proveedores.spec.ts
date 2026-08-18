import fs from "node:fs";
import { test, expect, type Page } from "@playwright/test";
import { login } from "./helpers";

const QA_PASSWORD = "Qa-Rbac-2026!";

/** Waits for the list's initial fetch to settle before a test starts interacting with it. */
async function waitForProveedoresLoaded(page: Page) {
  await expect(page.getByRole("heading", { name: "Proveedores" })).toBeVisible();
  await expect(page.getByText("Cargando…")).not.toBeVisible({ timeout: 15000 });
}

test.describe("Proveedores list", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto("/proveedores");
    await waitForProveedoresLoaded(page);
  });

  test("lists real suppliers from the backend with numbered rows", async ({ page }) => {
    await expect(page.getByRole("table")).toBeVisible();
    const firstRow = page.getByRole("row").nth(1);
    await expect(firstRow.getByRole("cell").first()).toHaveText("1");
    await expect(page.getByText(/Mostrando 1–\d+ de \d+ resultados?/)).toBeVisible();
  });

  test("typing fewer than 3 characters does not trigger a search", async ({ page }) => {
    const rowCountBefore = await page.getByRole("row").count();
    await page.getByLabel("Buscar proveedores").fill("ba");
    await page.waitForTimeout(700);
    await expect(page.getByRole("row")).toHaveCount(rowCountBefore);
  });

  test("typing 3+ characters filters the table by nombre", async ({ page }) => {
    await page.getByLabel("Buscar proveedores").fill("zzzzznoexiste");
    await expect(page.getByText("No se encontraron proveedores.")).toBeVisible({ timeout: 10000 });
    await page.getByLabel("Buscar proveedores").fill("");
    await expect(page.getByText("No se encontraron proveedores.")).not.toBeVisible();
  });

  test("search also matches on NIT, not just nombre", async ({ page }) => {
    // Confirmed against the real backend: ProveedorController::index() searches
    // nombre/nit/contacto — "935381635-3" is Distribuidora Pet Colombia's real, unique NIT.
    await page.getByLabel("Buscar proveedores").fill("935381635-3");
    await expect(page.getByRole("row")).toHaveCount(2, { timeout: 10000 });
    await expect(page.getByRole("row").filter({ hasText: "Distribuidora Pet Colombia" })).toBeVisible();
  });

  test("search also matches on contacto, not just nombre", async ({ page }) => {
    await page.getByLabel("Buscar proveedores").fill("Nicola Thompson");
    await expect(page.getByRole("row")).toHaveCount(2, { timeout: 10000 });
    await expect(page.getByRole("row").filter({ hasText: "Distribuidora Pet Colombia" })).toBeVisible();
  });

  test("search does NOT match on email — confirmed unsupported by the real backend", async ({ page }) => {
    // ProveedorController::index() only ORs nombre/nit/contacto — email is deliberately
    // excluded. A search on a real, unique email should return no results.
    await page.getByLabel("Buscar proveedores").fill("kub.garret@fahey.org");
    await expect(page.getByText("No se encontraron proveedores.")).toBeVisible({ timeout: 10000 });
  });

  test("filters by estado", async ({ page }) => {
    await page.getByLabel("Filtrar por estado").click();
    await page.getByRole("option", { name: "Todos", exact: true }).click();
    await expect(page.getByText(/Mostrando \d+–\d+ de \d+ resultados?/)).toBeVisible({ timeout: 10000 });
  });

  test("changes page size and resets to page 1", async ({ page }) => {
    await page.getByLabel("Filas por página").click();
    await page.getByRole("option", { name: "10", exact: true }).click();
    await expect(page.getByLabel("Ir a página")).toHaveValue("1", { timeout: 10000 });
    await expect(page.getByRole("row")).toHaveCount(11); // header + 10 data rows
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

  test("Ver opens a modal with the supplier's real details, not a page navigation", async ({ page }) => {
    await page.getByLabel("Buscar proveedores").fill("Distribuidora Pet Colombia");
    await expect(page.getByRole("row")).toHaveCount(2, { timeout: 10000 });
    const row = page.getByRole("row").filter({ hasText: "Distribuidora Pet Colombia" });
    await row.getByRole("button", { name: "Acciones" }).click();
    await page.getByRole("menuitem", { name: "Ver" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Distribuidora Pet Colombia", { exact: true })).toBeVisible();
    await expect(dialog.getByText("935381635-3")).toBeVisible();
    await expect(dialog.getByText("kub.garret@fahey.org")).toBeVisible();
    await expect(dialog.getByText("Nicola Thompson QA Test")).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Editar" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: /^(Deshabilitar|Habilitar)$/ })).toBeVisible();
    await expect(page).toHaveURL(/\/proveedores(\?.*)?$/);
  });

  test("clicking a supplier's name also opens the Ver modal", async ({ page }) => {
    await page.getByLabel("Buscar proveedores").fill("Distribuidora Pet Colombia");
    await expect(page.getByRole("row")).toHaveCount(2, { timeout: 10000 });
    await page.getByRole("row").filter({ hasText: "Distribuidora Pet Colombia" }).getByRole("button").first().click();
    await expect(page.getByRole("dialog").getByText("Distribuidora Pet Colombia", { exact: true })).toBeVisible();
  });

  test("Ver modal's Productos tab lists the supplier's real associated products, read-only", async ({ page }) => {
    await page.getByLabel("Buscar proveedores").fill("Distribuidora Pet Colombia");
    await expect(page.getByRole("row")).toHaveCount(2, { timeout: 10000 });
    await page.getByRole("row").filter({ hasText: "Distribuidora Pet Colombia" }).getByRole("button").first().click();

    const dialog = page.getByRole("dialog");
    await dialog.getByRole("tab", { name: "Productos" }).click();
    // Distribuidora Pet Colombia has real associated products in the shared demo dataset.
    await expect(dialog.getByRole("listitem").first()).toBeVisible({ timeout: 10000 });
    // Read-only: no action buttons anywhere in this tab.
    await expect(dialog.getByRole("button", { name: /Editar|Deshabilitar|Habilitar/ })).toHaveCount(0);
  });

  test("Nuevo Proveedor opens a modal with real backend-driven fields and validates the required name", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Nuevo Proveedor" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Nuevo Proveedor" })).toBeVisible();
    await expect(dialog.getByLabel("Nombre")).toBeVisible();
    await expect(dialog.getByLabel("NIT")).toBeVisible();
    await expect(dialog.getByLabel("Email")).toBeVisible();
    await expect(dialog.getByLabel("Contacto")).toBeVisible();

    // Pure client-side zod validation — no network call, nothing created.
    await dialog.getByRole("button", { name: "Crear proveedor" }).click();
    await expect(dialog.getByText("El nombre es obligatorio.")).toBeVisible();
  });

  test("Nuevo Proveedor sends nombre, nit, email, and operational fields in the request payload", async ({
    page,
  }) => {
    // Intercepted and fulfilled locally instead of hitting the real backend:
    // ProveedorController has no destroy endpoint (physical delete is never
    // allowed), so a real submission here would create a permanent,
    // uncleanable row on every test run — same reasoning already applied to
    // Usuarios/Roles/Categorías. The real end-to-end create -> edit ->
    // habilitar/deshabilitar cycle was verified manually against the real
    // backend with disposable, tinker-deleted data (see report).
    let requestBody: unknown;
    await page.route("**/api/v1/proveedores", async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      requestBody = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "Proveedor creado correctamente",
          data: {
            id: 999999, nombre: "Payload Shape Check", nit: "NIT-1", email: "psc@example.com",
            contacto: null, telefono: null, direccion: null, ciudad: null, pais: null, notas: null,
            estado: "activo", created_at: "", updated_at: "",
          },
        }),
      });
    });

    await page.getByRole("button", { name: "Nuevo Proveedor" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Nombre").fill("Payload Shape Check");
    await dialog.getByLabel("NIT").fill("NIT-1");
    await dialog.getByLabel("Email").fill("psc@example.com");
    await dialog.getByRole("button", { name: "Crear proveedor" }).click();
    await expect(dialog).not.toBeVisible({ timeout: 10000 });

    expect(requestBody).toMatchObject({ nombre: "Payload Shape Check", nit: "NIT-1", email: "psc@example.com" });
  });

  test("Editar proveedor shows NIT and email as read-only, and sends only operational fields", async ({ page }) => {
    // Same interception reasoning as the create test, applied to an existing
    // real supplier (Distribuidora Pet Colombia) so this test never mutates real shared
    // demo data either.
    let requestBody: unknown;
    await page.route("**/api/v1/proveedores/*", async (route) => {
      if (route.request().method() !== "PATCH") return route.fallback();
      requestBody = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "Proveedor actualizado correctamente",
          data: {
            id: 1, nombre: "Distribuidora Pet Colombia", nit: "935381635-3", email: "kub.garret@fahey.org",
            contacto: "Contacto Editado", telefono: null, direccion: null, ciudad: null, pais: null,
            notas: null, estado: "activo", created_at: "", updated_at: "",
          },
        }),
      });
    });

    await page.getByLabel("Buscar proveedores").fill("Distribuidora Pet Colombia");
    await expect(page.getByRole("row")).toHaveCount(2, { timeout: 10000 });
    await page.getByRole("row").filter({ hasText: "Distribuidora Pet Colombia" }).getByRole("button", { name: "Acciones" }).click();
    await page.getByRole("menuitem", { name: "Editar" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Editar proveedor" })).toBeVisible({ timeout: 10000 });
    const nitInput = dialog.getByLabel("NIT");
    const emailInput = dialog.getByLabel("Email");
    await expect(nitInput).toBeDisabled();
    await expect(emailInput).toBeDisabled();
    await expect(nitInput).toHaveValue("935381635-3");
    await expect(emailInput).toHaveValue("kub.garret@fahey.org");

    await dialog.getByLabel("Contacto").fill("Contacto Editado");
    await dialog.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(dialog).not.toBeVisible({ timeout: 10000 });

    expect(requestBody).toMatchObject({ contacto: "Contacto Editado" });
    expect(requestBody).not.toHaveProperty("nit");
    expect(requestBody).not.toHaveProperty("email");
  });

  test("disabling and re-enabling a supplier persists in both directions", async ({ page }) => {
    // Uses "Connelly Inc" — a different, otherwise-unreferenced real supplier
    // from the one every read-only test above uses (Distribuidora Pet Colombia).
    // playwright.config.ts sets fullyParallel: true, so a test that mutates a
    // real record and one that reads it can run concurrently; isolating the
    // mutating test onto its own record sidesteps that race entirely
    // (previously hit and fixed for Categorías — see project memory).
    await page.getByLabel("Buscar proveedores").fill("Connelly Inc");
    await expect(page.getByRole("row")).toHaveCount(2, { timeout: 10000 });
    const row = page.getByRole("row").filter({ hasText: "Connelly Inc" });
    await row.getByRole("button").first().click();

    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Deshabilitar" }).click();
    await expect(dialog.getByText("Inactivo")).toBeVisible({ timeout: 10000 });

    await dialog.getByRole("button", { name: "Habilitar" }).click();
    await expect(dialog.getByText("Activo")).toBeVisible({ timeout: 10000 });
  });

  test("is responsive: sidebar becomes a sheet on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(page.getByRole("button", { name: "Abrir menú" })).toBeVisible();
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await expect(page.getByRole("link", { name: "Proveedores" })).toBeVisible();
  });

  test("CSV and PDF export buttons are visible in the toolbar", async ({ page }) => {
    await expect(page.getByRole("button", { name: "CSV" })).toBeVisible();
    await expect(page.getByRole("button", { name: "PDF" })).toBeVisible();
    await expect(page.getByLabel("Buscar proveedores")).toBeVisible();
  });

  test("CSV button downloads a real CSV file with real data", async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "CSV" }).click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/^proveedores-.*\.csv$/);
    const filePath = await download.path();
    const contenido = fs.readFileSync(filePath, "utf-8");
    expect(contenido).toContain("#,Nombre,NIT,Contacto,Teléfono,Email,Estado");
    expect(contenido).toContain("Distribuidora Pet Colombia");
  });

  test("PDF button downloads a real, valid PDF file", async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "PDF" }).click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/^proveedores-.*\.pdf$/);
    const filePath = await download.path();
    const header = fs.readFileSync(filePath).subarray(0, 4).toString("utf-8");
    expect(header).toBe("%PDF");
    expect(fs.statSync(filePath).size).toBeGreaterThan(1000);
  });

  test("CSV export respects the current search filter, covering the full filtered set", async ({ page }) => {
    await page.getByLabel("Buscar proveedores").fill("Distribuidora Pet Colombia");
    await expect(page.getByRole("row")).toHaveCount(2, { timeout: 10000 });

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "CSV" }).click(),
    ]);

    const filePath = await download.path();
    const contenido = fs.readFileSync(filePath, "utf-8");
    const filas = contenido.trim().split("\n");
    expect(filas).toHaveLength(2); // header + exactly the one matching supplier
    expect(contenido).toContain("Distribuidora Pet Colombia");
  });

  test("exporting does not disturb the list, search, filters, or pagination", async ({ page }) => {
    await page.getByLabel("Buscar proveedores").fill("Distribuidora Pet Colombia");
    await expect(page.getByRole("row")).toHaveCount(2, { timeout: 10000 });

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "PDF" }).click(),
    ]);
    await download.path();

    await expect(page.getByRole("row")).toHaveCount(2);
    await expect(page.getByLabel("Buscar proveedores")).toHaveValue("Distribuidora Pet Colombia");
  });
});

test.describe("Proveedores RBAC and multi-tenant isolation", () => {
  test("authorized user (Administrador, all proveedores.* permissions) sees the nav link and the management UI", async ({
    page,
  }) => {
    await login(page);
    await expect(page.getByRole("link", { name: "Proveedores" })).toBeVisible();
    await page.getByRole("link", { name: "Proveedores" }).click();
    await waitForProveedoresLoaded(page);
    await expect(page.getByRole("button", { name: "Nuevo Proveedor" })).toBeVisible();
    await expect(page.getByRole("row").nth(1).getByRole("button", { name: "Acciones" })).toBeVisible();
  });

  test("unauthorized user (Supervisor, no proveedores.* permission) has no nav link and is blocked from /proveedores", async ({
    page,
  }) => {
    await login(page, "qa-rbac-supervisor@example.com", QA_PASSWORD);
    await expect(page.getByRole("link", { name: "Proveedores" })).toHaveCount(0);

    await page.goto("/proveedores");
    await expect(page.getByText("No tienes permiso para ver este módulo.")).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("table")).toHaveCount(0);
    // The export buttons live inside the gated page body — never rendered for this user.
    await expect(page.getByRole("button", { name: "CSV" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "PDF" })).toHaveCount(0);
  });

  test("multi-tenant: Empresa B's Administrador never sees Empresa A's suppliers", async ({ page }) => {
    await login(page, "qa-rbac-admin-b@example.com", QA_PASSWORD);
    await page.goto("/proveedores");
    await waitForProveedoresLoaded(page);

    await page.getByLabel("Filtrar por estado").click();
    await page.getByRole("option", { name: "Todos", exact: true }).click();
    await page.waitForTimeout(1000);
    await expect(page.getByText("Distribuidora Pet Colombia")).toHaveCount(0);
  });

  test("multi-tenant: Empresa B's Administrador exports only Empresa B's suppliers", async ({ page }) => {
    await login(page, "qa-rbac-admin-b@example.com", QA_PASSWORD);
    await page.goto("/proveedores");
    await waitForProveedoresLoaded(page);

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "CSV" }).click(),
    ]);

    const filePath = await download.path();
    const contenido = fs.readFileSync(filePath, "utf-8");
    expect(contenido).not.toContain("Distribuidora Pet Colombia");
  });

  test("multi-tenant: direct ID access to another company's supplier is blocked at the API", async ({ page }) => {
    // Proveedores has no standalone detail route (Ver is modal-only, same
    // scoping decision as Roles/Categorías) — verified instead via a direct
    // API call. The access token lives outside any cookie (token-store.ts),
    // so page.request wouldn't carry it automatically; captured here from a
    // real authenticated request the app makes on its own during navigation.
    let authHeader: string | undefined;
    page.on("request", (request) => {
      if (!authHeader && request.url().includes("/api/v1/proveedores")) {
        authHeader = request.headers()["authorization"];
      }
    });

    await login(page, "qa-rbac-admin-b@example.com", QA_PASSWORD);
    await page.goto("/proveedores");
    await waitForProveedoresLoaded(page);
    expect(authHeader).toBeTruthy();

    // id 83 is Distribuidora Pet Colombia's real id (Empresa A); qa-rbac-admin-b is Empresa B's Administrador.
    const response = await page.request.get("/api/v1/proveedores/83", {
      headers: { Authorization: authHeader! },
    });
    expect(response.status()).toBe(404);
  });
});
