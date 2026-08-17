import { test, expect, type Page } from "@playwright/test";
import { login } from "./helpers";

const QA_PASSWORD = "Qa-Rbac-2026!";

/** Waits for the list's initial fetch to settle before a test starts interacting with it. */
async function waitForCategoriasLoaded(page: Page) {
  await expect(page.getByRole("heading", { name: "Categorías" })).toBeVisible();
  await expect(page.getByText("Cargando…")).not.toBeVisible({ timeout: 15000 });
}

test.describe("Categorías list", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto("/categorias");
    await waitForCategoriasLoaded(page);
  });

  test("lists real categories from the backend with numbered rows and product counts", async ({ page }) => {
    await expect(page.getByRole("table")).toBeVisible();
    const firstRow = page.getByRole("row").nth(1);
    await expect(firstRow.getByRole("cell").first()).toHaveText("1");
    // "Accesorios" sorts first alphabetically and is real, seeded, permanent data.
    await expect(firstRow.getByText("Accesorios")).toBeVisible();
    await expect(page.getByText(/resultados? · página 1 de/)).toBeVisible();
  });

  test("typing fewer than 3 characters does not trigger a search", async ({ page }) => {
    const rowCountBefore = await page.getByRole("row").count();
    await page.getByLabel("Buscar categorías").fill("ac");
    await page.waitForTimeout(700);
    await expect(page.getByRole("row")).toHaveCount(rowCountBefore);
  });

  test("typing 3+ characters filters the table by nombre", async ({ page }) => {
    await page.getByLabel("Buscar categorías").fill("zzzzznoexiste");
    await expect(page.getByText("No se encontraron categorías.")).toBeVisible({ timeout: 10000 });
    await page.getByLabel("Buscar categorías").fill("");
    await expect(page.getByText("No se encontraron categorías.")).not.toBeVisible();
  });

  test("search also matches on descripcion, not just nombre", async ({ page }) => {
    // Confirmed against the real backend: CategoriaController::index() searches
    // `nombre LIKE` OR `descripcion LIKE`. "Mollitia" appears only in the real seeded
    // description of "Alimento para gatos" (verified: 0 nombre matches, 1 descripcion
    // match) — a hit here proves the descripcion field is actually searched, not just
    // nombre like Roles' equivalent search.
    await page.getByLabel("Buscar categorías").fill("Mollitia");
    await expect(page.getByRole("row")).toHaveCount(2, { timeout: 10000 });
    await expect(page.getByRole("row").filter({ hasText: "Alimento para gatos" })).toBeVisible();
  });

  test("filters by estado", async ({ page }) => {
    await page.getByLabel("Filtrar por estado").click();
    await page.getByRole("option", { name: "Todas", exact: true }).click();
    await expect(page.getByText(/resultados? · página/)).toBeVisible({ timeout: 10000 });
  });

  test("changes page size and resets to page 1", async ({ page }) => {
    await page.getByLabel("Filas por página").click();
    await page.getByRole("option", { name: "10", exact: true }).click();
    await expect(page.getByText(/· página 1 de/)).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("row")).toHaveCount(11); // header + 10 data rows
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

  test("Ver opens a modal with the category's real details, not a page navigation", async ({ page }) => {
    await page.getByLabel("Buscar categorías").fill("Accesorios");
    await expect(page.getByRole("row")).toHaveCount(2, { timeout: 10000 });
    const row = page.getByRole("row").filter({ hasText: "Accesorios" });
    await row.getByRole("button", { name: "Acciones" }).click();
    await page.getByRole("menuitem", { name: "Ver" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Accesorios", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Activo")).toBeVisible();
    await expect(dialog.getByText("Productos asociados")).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Editar" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: /^(Deshabilitar|Habilitar)$/ })).toBeVisible();
    await expect(page).toHaveURL(/\/categorias(\?.*)?$/);
  });

  test("clicking a category's name also opens the Ver modal", async ({ page }) => {
    await page.getByLabel("Buscar categorías").fill("Accesorios");
    await expect(page.getByRole("row")).toHaveCount(2, { timeout: 10000 });
    await page.getByRole("row").filter({ hasText: "Accesorios" }).getByRole("button").first().click();
    await expect(page.getByRole("dialog").getByText("Accesorios", { exact: true })).toBeVisible();
  });

  test("Ver modal's Productos tab lists the category's real associated products, read-only", async ({ page }) => {
    await page.getByLabel("Buscar categorías").fill("Accesorios");
    await expect(page.getByRole("row")).toHaveCount(2, { timeout: 10000 });
    await page.getByRole("row").filter({ hasText: "Accesorios" }).getByRole("button").first().click();

    const dialog = page.getByRole("dialog");
    await dialog.getByRole("tab", { name: "Productos" }).click();
    // Accesorios has real associated products in the shared demo dataset — assert
    // presence, not an exact count, since that count is shared/mutable state.
    await expect(dialog.getByRole("listitem").first()).toBeVisible({ timeout: 10000 });
    // Read-only: no action buttons anywhere in this tab.
    await expect(dialog.getByRole("button", { name: /Editar|Deshabilitar|Habilitar/ })).toHaveCount(0);
  });

  test("disabling a category with associated products succeeds — no blocking guard exists for Categorías", async ({
    page,
  }) => {
    // Deliberate, confirmed difference from Roles: RoleService blocks deactivating a role
    // with assigned users (409); CategoriaController explicitly documents the opposite —
    // categoria_id on productos is nullable and never nulled on disable, so disabling a
    // populated category is safe by design. Restored immediately after (real shared data).
    await page.getByLabel("Buscar categorías").fill("Accesorios");
    await expect(page.getByRole("row")).toHaveCount(2, { timeout: 10000 });
    const row = page.getByRole("row").filter({ hasText: "Accesorios" });
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
    await expect(page.getByRole("link", { name: "Categorías" })).toBeVisible();
  });

  test("Nueva Categoría opens a modal with real backend-driven fields and validates the required name", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Nueva Categoría" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Nueva Categoría" })).toBeVisible();
    await expect(dialog.getByLabel("Nombre")).toBeVisible();
    await expect(dialog.getByLabel("Descripción")).toBeVisible();

    // Pure client-side zod validation — no network call, nothing created.
    await dialog.getByRole("button", { name: "Crear categoría" }).click();
    await expect(dialog.getByText("El nombre es obligatorio.")).toBeVisible();
  });

  test("Nueva Categoría sends nombre and descripcion in the request payload", async ({ page }) => {
    // Intercepted and fulfilled locally instead of hitting the real backend:
    // CategoriaController has no destroy endpoint (physical delete is never allowed,
    // confirmed in the backend audit), so a real submission here would create a
    // permanent, uncleanable row on every test run — same reasoning already applied to
    // Usuarios' invitation test and Roles' create test. The real end-to-end create ->
    // edit -> habilitar/deshabilitar cycle was verified manually against the real
    // backend with disposable, tinker-deleted data (see report).
    let requestBody: unknown;
    await page.route("**/api/v1/categorias", async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      requestBody = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "Categoría creada correctamente",
          data: { id: 999999, nombre: "Payload Shape Check", descripcion: "desc", estado: "activo", productos_count: 0, created_at: "", updated_at: "" },
        }),
      });
    });

    await page.getByRole("button", { name: "Nueva Categoría" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Nombre").fill("Payload Shape Check");
    await dialog.getByLabel("Descripción").fill("desc");
    await dialog.getByRole("button", { name: "Crear categoría" }).click();
    await expect(dialog).not.toBeVisible({ timeout: 10000 });

    expect(requestBody).toMatchObject({ nombre: "Payload Shape Check", descripcion: "desc" });
  });

  test("Editar categoría sends the updated nombre and descripcion in the request payload", async ({ page }) => {
    // Same interception reasoning as the create test, applied to an existing real
    // category (Adiestramiento) so this test never mutates real shared demo data either.
    // Matched by a single-segment wildcard (not a hardcoded id) so it only catches
    // PATCH /categorias/{id} and not the two-segment /categorias/{id}/habilitar route.
    let requestBody: unknown;
    await page.route("**/api/v1/categorias/*", async (route) => {
      if (route.request().method() !== "PATCH") return route.fallback();
      requestBody = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "Categoría actualizada correctamente",
          data: { id: 19, nombre: "Adiestramiento Editado", descripcion: "desc", estado: "activo", productos_count: 0, created_at: "", updated_at: "" },
        }),
      });
    });

    await page.getByLabel("Buscar categorías").fill("Adiestramiento");
    await expect(page.getByRole("row")).toHaveCount(2, { timeout: 10000 });
    await page.getByRole("row").filter({ hasText: "Adiestramiento" }).getByRole("button", { name: "Acciones" }).click();
    await page.getByRole("menuitem", { name: "Editar" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Editar categoría" })).toBeVisible({ timeout: 10000 });
    const nameInput = dialog.getByLabel("Nombre");
    await expect(nameInput).toHaveValue("Adiestramiento");
    await nameInput.fill("Adiestramiento Editado");
    await dialog.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(dialog).not.toBeVisible({ timeout: 10000 });

    expect(requestBody).toMatchObject({ nombre: "Adiestramiento Editado" });
  });
});

test.describe("Categorías RBAC and multi-tenant isolation", () => {
  test("authorized user (Administrador, all categorias.* permissions) sees the nav link and the management UI", async ({
    page,
  }) => {
    await login(page);
    await expect(page.getByRole("link", { name: "Categorías" })).toBeVisible();
    await page.getByRole("link", { name: "Categorías" }).click();
    await waitForCategoriasLoaded(page);
    await expect(page.getByRole("button", { name: "Nueva Categoría" })).toBeVisible();
    await expect(page.getByRole("row").nth(1).getByRole("button", { name: "Acciones" })).toBeVisible();
  });

  test("unauthorized user (Supervisor, no categorias.* permission) has no nav link and is blocked from /categorias", async ({
    page,
  }) => {
    await login(page, "qa-rbac-supervisor@example.com", QA_PASSWORD);
    await expect(page.getByRole("link", { name: "Categorías" })).toHaveCount(0);

    await page.goto("/categorias");
    await expect(page.getByText("No tienes permiso para ver este módulo.")).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("table")).toHaveCount(0);
  });

  test("multi-tenant: Empresa B's Administrador never sees Empresa A's categories", async ({ page }) => {
    await login(page, "qa-rbac-admin-b@example.com", QA_PASSWORD);
    await page.goto("/categorias");
    await waitForCategoriasLoaded(page);

    await page.getByLabel("Filtrar por estado").click();
    await page.getByRole("option", { name: "Todas", exact: true }).click();
    await page.waitForTimeout(1000);
    // "Accesorios" only exists in Empresa A; Empresa B has its own distinctly-named
    // real categories (Alimento para perros/gatos, Snacks y premios) plus its own
    // separately-prefixed "E2E Categoria B ..." test rows — neither should ever show
    // Empresa A's data.
    await expect(page.getByText("Accesorios")).toHaveCount(0);
  });

  test("multi-tenant: direct ID access to another company's category is blocked at the API", async ({ page }) => {
    // Categorías has no standalone detail route to navigate to directly (Ver is
    // modal-only, same scoping decision as Roles) — verified instead via a direct API
    // call. The access token lives outside any cookie (deliberate architecture — see
    // token-store.ts), so page.request wouldn't carry it automatically; captured here
    // from a real authenticated request the app makes on its own during navigation.
    // Accesorios (id 5) belongs to Empresa A; qa-rbac-admin-b is Empresa B's Administrador.
    let authHeader: string | undefined;
    page.on("request", (request) => {
      if (!authHeader && request.url().includes("/api/v1/categorias")) {
        authHeader = request.headers()["authorization"];
      }
    });

    await login(page, "qa-rbac-admin-b@example.com", QA_PASSWORD);
    await page.goto("/categorias");
    await waitForCategoriasLoaded(page);
    expect(authHeader).toBeTruthy();

    const response = await page.request.get("/api/v1/categorias/5", {
      headers: { Authorization: authHeader! },
    });
    expect(response.status()).toBe(404);
  });
});
