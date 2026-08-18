import fs from "node:fs";
import { test, expect, type Page, type Locator, type APIRequestContext } from "@playwright/test";
import { login, DEMO_EMAIL, DEMO_PASSWORD } from "./helpers";

const QA_PASSWORD = "Qa-Rbac-2026!";

/**
 * Pagination tests need >10 active roles to reach a second page. RoleSeeder
 * only creates 5 real roles per empresa (roles are curated business data,
 * not high-volume like Categorías/Proveedores) — there is no ambient seed
 * to rely on. Creates its own fixture roles via the real API and
 * deactivates them afterward (roles have no hard-delete endpoint by
 * design), so the suite doesn't reintroduce the kind of unbounded
 * test-created role buildup that was just cleaned out of the database.
 */
/**
 * Idempotent by design: `desactivar` never frees the (empresa_id, name,
 * guard_name) unique constraint (it's a status flag, not a delete, and
 * roles have no hard-delete endpoint) — a plain create-then-deactivate
 * fixture would collide with its own leftovers on every run after the
 * first. Reuses-and-reactivates an existing fixture role by name instead
 * of creating a duplicate, so repeated runs stay at exactly `count` rows.
 */
async function createPaginationFixtureRoles(
  request: APIRequestContext,
  count: number
): Promise<{ ids: number[]; token: string }> {
  const loginRes = await request.post("/api/v1/auth/login", {
    data: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
  });
  const { access_token: token } = (await loginRes.json()).data;
  const headers = { Authorization: `Bearer ${token}` };

  const existingRes = await request.get("/api/v1/roles", {
    headers,
    params: { busqueda: "Rol de prueba (paginación)", estado: "todos", per_page: 100 },
  });
  const existingByName = new Map<string, number>(
    ((await existingRes.json()).data.items as Array<{ id: number; name: string }>).map((r) => [r.name, r.id])
  );

  const ids: number[] = [];
  for (let i = 1; i <= count; i++) {
    const name = `Rol de prueba (paginación) ${i}`;
    const existingId = existingByName.get(name);
    if (existingId) {
      await request.post(`/api/v1/roles/${existingId}/activar`, { headers });
      ids.push(existingId);
    } else {
      const res = await request.post("/api/v1/roles", { headers, data: { name } });
      ids.push((await res.json()).data.id);
    }
  }
  return { ids, token };
}

async function deactivatePaginationFixtureRoles(request: APIRequestContext, token: string, ids: number[]): Promise<void> {
  for (const id of ids) {
    await request.post(`/api/v1/roles/${id}/desactivar`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}

/** Waits for the list's initial fetch to settle before a test starts interacting with it. */
async function waitForRolesLoaded(page: Page) {
  await expect(page.getByRole("heading", { name: "Roles" })).toBeVisible();
  await expect(page.getByText("Cargando…")).not.toBeVisible({ timeout: 15000 });
}

/**
 * The permission catalog's checkbox is a base-ui custom `role="checkbox"` element; the
 * `id="perm-{permission}"` prop actually lands on a visually-hidden native input used only
 * for label association (confirmed via DOM inspection), not on the interactive element
 * itself. The real, clickable `role="checkbox"` is that hidden input's sibling within the
 * same wrapper — this locates it deterministically regardless of visible label text, which
 * repeats across modules (many groups have their own "ver"/"crear"/"editar" permission).
 */
function permissionCheckbox(scope: Locator, permission: string) {
  return scope.locator(`[id="perm-${permission}"]`).locator("xpath=..").getByRole("checkbox");
}

test.describe("Roles list", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto("/roles");
    await waitForRolesLoaded(page);
  });

  test("lists real roles from the backend with numbered rows and permission/user counts", async ({ page }) => {
    await expect(page.getByRole("table")).toBeVisible();
    const firstRow = page.getByRole("row").nth(1);
    await expect(firstRow.getByRole("cell").first()).toHaveText("1");
    // Administrador sorts first alphabetically and is real, seeded, permanent data.
    await expect(firstRow.getByText("Administrador")).toBeVisible();
    await expect(page.getByText(/resultados? · página 1 de/)).toBeVisible();
  });

  test("typing fewer than 3 characters does not trigger a search", async ({ page }) => {
    const rowCountBefore = await page.getByRole("row").count();
    await page.getByLabel("Buscar roles").fill("ad");
    await page.waitForTimeout(700);
    await expect(page.getByRole("row")).toHaveCount(rowCountBefore);
  });

  test("typing 3+ characters filters the table", async ({ page }) => {
    await page.getByLabel("Buscar roles").fill("zzzzznoexiste");
    await expect(page.getByText("No se encontraron roles.")).toBeVisible({ timeout: 10000 });
    await page.getByLabel("Buscar roles").fill("");
    await expect(page.getByText("No se encontraron roles.")).not.toBeVisible();
  });

  test("filters by estado", async ({ page }) => {
    await page.getByLabel("Filtrar por estado").click();
    await page.getByRole("option", { name: "Todos", exact: true }).click();
    await expect(page.getByText(/resultados? · página/)).toBeVisible({ timeout: 10000 });
  });

  test.describe("with enough roles for a second page", () => {
    // Both tests below create fixture roles under the same fixed names —
    // running them in parallel workers races two concurrent creates
    // against the same unique (empresa_id, name, guard_name) constraint.
    test.describe.configure({ mode: "serial" });

    let fixture: { ids: number[]; token: string };

    test.beforeEach(async ({ request, page }) => {
      // RoleSeeder only creates 5 real roles per empresa — unlike
      // Categorías/Proveedores there's no ambient seed volume to page
      // through, so this creates its own and tears them down below.
      fixture = await createPaginationFixtureRoles(request, 7);
      await page.reload();
      await waitForRolesLoaded(page);
    });

    test.afterEach(async ({ request }) => {
      await deactivatePaginationFixtureRoles(request, fixture.token, fixture.ids);
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
  });

  test("Ver opens a modal with the role's real details, not a page navigation", async ({ page }) => {
    await page.getByLabel("Buscar roles").fill("Administrador");
    await expect(page.getByRole("row")).toHaveCount(2, { timeout: 10000 });
    const row = page.getByRole("row").filter({ hasText: "Administrador" });
    await row.getByRole("button", { name: "Acciones" }).click();
    await page.getByRole("menuitem", { name: "Ver" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Administrador", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Activo")).toBeVisible();
    await expect(dialog.getByText(/^Permisos \(\d+\)$/)).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Editar" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: /^(Desactivar|Activar)$/ })).toBeVisible();
    await expect(page).toHaveURL(/\/roles(\?.*)?$/);
  });

  test("clicking a role's name also opens the Ver modal", async ({ page }) => {
    await page.getByLabel("Buscar roles").fill("Administrador");
    await expect(page.getByRole("row")).toHaveCount(2, { timeout: 10000 });
    await page.getByRole("row").filter({ hasText: "Administrador" }).getByRole("button").first().click();
    await expect(page.getByRole("dialog").getByText("Administrador", { exact: true })).toBeVisible();
  });

  test("Ver modal's Usuarios tab lists the role's real assigned users, read-only", async ({ page }) => {
    await page.getByLabel("Buscar roles").fill("Administrador");
    await expect(page.getByRole("row")).toHaveCount(2, { timeout: 10000 });
    await page.getByRole("row").filter({ hasText: "Administrador" }).getByRole("button").first().click();

    const dialog = page.getByRole("dialog");
    await dialog.getByRole("tab", { name: "Usuarios" }).click();
    // Administrador has real assigned users in the shared demo dataset — assert presence,
    // not an exact count, since that count is shared/mutable state outside this test's control.
    await expect(dialog.getByText(/@/).first()).toBeVisible({ timeout: 10000 });
    // Read-only: no action buttons anywhere in this tab.
    await expect(dialog.getByRole("button", { name: /Editar|Desactivar|Activar/ })).toHaveCount(0);
  });

  test("attempting to deactivate a role with assigned users surfaces the real 409 error, not a silent failure", async ({
    page,
  }) => {
    await page.getByLabel("Buscar roles").fill("Administrador");
    await expect(page.getByRole("row")).toHaveCount(2, { timeout: 10000 });
    const row = page.getByRole("row").filter({ hasText: "Administrador" });
    await row.getByRole("button").first().click();

    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Desactivar" }).click();

    // The guard throws before any mutation, so this error renders on the page (shared with
    // the row-level toggle action), not inside the dialog itself.
    await expect(page.getByText(/Este rol tiene usuarios asignados/)).toBeVisible({ timeout: 10000 });
    // No partial mutation: the dialog's own state (a separate fetch) still reads Activo.
    await expect(dialog.getByText("Activo")).toBeVisible();

    // The open dialog marks the rest of the page inert, so the row behind it is excluded
    // from the accessibility tree until it closes — close it before checking the row too.
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(row.getByText("Activo")).toBeVisible();
  });

  test("is responsive: sidebar becomes a sheet on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(page.getByRole("button", { name: "Abrir menú" })).toBeVisible();
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await expect(page.getByRole("link", { name: "Roles" })).toBeVisible();
  });

  test("Nuevo Rol opens a modal with real backend-driven fields and validates the required name", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Nuevo Rol" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Nuevo Rol" })).toBeVisible();
    await expect(dialog.getByLabel("Nombre")).toBeVisible();
    await expect(dialog.getByText("Permisos", { exact: true })).toBeVisible();

    // Pure client-side zod validation — no network call, nothing created.
    await dialog.getByRole("button", { name: "Crear rol" }).click();
    await expect(dialog.getByText("El nombre es obligatorio.")).toBeVisible();
  });

  test("Permisos catalog loads real permissions from the backend and the selected counter updates on toggle", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Nuevo Rol" }).click();
    const dialog = page.getByRole("dialog");
    // Real GET /v1/permisos response landing — not hardcoded, not "0 de 0".
    await expect(dialog.getByText(/^0 de \d+ permisos seleccionados$/)).toBeVisible({ timeout: 10000 });
    const totalText = await dialog.getByText(/^0 de \d+ permisos seleccionados$/).textContent();
    const total = Number(totalText?.match(/de (\d+)/)?.[1]);
    expect(total).toBeGreaterThan(0);

    await permissionCheckbox(dialog, "productos.ver").click();
    await expect(dialog.getByText(`1 de ${total} permisos seleccionados`)).toBeVisible();
    await permissionCheckbox(dialog, "productos.ver").click();
    await expect(dialog.getByText(`0 de ${total} permisos seleccionados`)).toBeVisible();
  });

  test("Nuevo Rol sends the name and the selected permisos in the request payload", async ({ page }) => {
    // Intercepted and fulfilled locally instead of hitting the real backend: RoleController
    // has no destroy endpoint (physical delete is never allowed, confirmed in the backend
    // audit), so a real submission here would create a permanent, uncleanable row on every
    // test run — the same reasoning already applied to Usuarios' invitation payload test.
    // The real end-to-end create → edit → permissions → activate/deactivate cycle was
    // verified manually against the real backend with disposable, tinker-deleted data (see
    // report); this test only pins down the payload shape the frontend actually sends.
    let requestBody: unknown;
    await page.route("**/api/v1/roles", async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      requestBody = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "Rol creado correctamente",
          data: { id: 999999, name: "Payload Shape Check", estado: "activo", permisos: ["productos.ver"], permisos_count: 1, usuarios_count: 0, created_at: "", updated_at: "" },
        }),
      });
    });

    await page.getByRole("button", { name: "Nuevo Rol" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Nombre").fill("Payload Shape Check");
    await expect(dialog.getByText(/^0 de \d+ permisos seleccionados$/)).toBeVisible({ timeout: 10000 });
    await permissionCheckbox(dialog, "productos.ver").click();
    await dialog.getByRole("button", { name: "Crear rol" }).click();
    await expect(dialog).not.toBeVisible({ timeout: 10000 });

    expect(requestBody).toMatchObject({
      name: "Payload Shape Check",
      permisos: ["productos.ver"],
    });
  });

  test("Editar rol sends the updated name and permisos in the request payload", async ({ page }) => {
    // Same interception reasoning as the create test, applied to an existing real role
    // (Auxiliar Contable) so this test never mutates real shared demo data either.
    let requestBody: unknown;
    await page.route("**/api/v1/roles/5", async (route) => {
      if (route.request().method() !== "PATCH") return route.fallback();
      requestBody = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "Rol actualizado correctamente",
          data: { id: 5, name: "Auxiliar Contable Editado", estado: "activo", permisos: ["productos.ver"], permisos_count: 1, usuarios_count: 0, created_at: "", updated_at: "" },
        }),
      });
    });

    await page.getByLabel("Buscar roles").fill("Auxiliar Contable");
    await expect(page.getByRole("row")).toHaveCount(2, { timeout: 10000 });
    await page.getByRole("row").filter({ hasText: "Auxiliar Contable" }).getByRole("button", { name: "Acciones" }).click();
    await page.getByRole("menuitem", { name: "Editar" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Editar rol" })).toBeVisible({ timeout: 10000 });
    const nameInput = dialog.getByLabel("Nombre");
    await expect(nameInput).toHaveValue("Auxiliar Contable");
    await nameInput.fill("Auxiliar Contable Editado");
    await dialog.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(dialog).not.toBeVisible({ timeout: 10000 });

    expect(requestBody).toMatchObject({ name: "Auxiliar Contable Editado" });
  });

  test("CSV and PDF export buttons are visible in the toolbar", async ({ page }) => {
    await expect(page.getByRole("button", { name: "CSV" })).toBeVisible();
    await expect(page.getByRole("button", { name: "PDF" })).toBeVisible();
    await expect(page.getByLabel("Buscar roles")).toBeVisible();
  });

  test("CSV button downloads a real CSV file with real data", async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "CSV" }).click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/^roles-.*\.csv$/);
    const filePath = await download.path();
    const contenido = fs.readFileSync(filePath, "utf-8");
    expect(contenido).toContain("#,Nombre,Estado,Permisos,Usuarios");
    // Administrador is real, permanent, seeded data.
    expect(contenido).toContain("Administrador");
  });

  test("PDF button downloads a real, valid PDF file", async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "PDF" }).click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/^roles-.*\.pdf$/);
    const filePath = await download.path();
    const header = fs.readFileSync(filePath).subarray(0, 4).toString("utf-8");
    expect(header).toBe("%PDF");
    expect(fs.statSync(filePath).size).toBeGreaterThan(1000);
  });

  test("CSV export respects the current search filter, covering the full filtered set", async ({ page }) => {
    await page.getByLabel("Buscar roles").fill("Auxiliar Contable");
    await expect(page.getByRole("row")).toHaveCount(2, { timeout: 10000 });

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "CSV" }).click(),
    ]);

    const filePath = await download.path();
    const contenido = fs.readFileSync(filePath, "utf-8");
    const filas = contenido.trim().split("\n");
    // Header + exactly the one matching role — not the ~230 role company roster.
    expect(filas).toHaveLength(2);
    expect(contenido).toContain("Auxiliar Contable");
  });

  test("exporting does not disturb the list, search, filters, or pagination", async ({ page }) => {
    await page.getByLabel("Buscar roles").fill("Bodeguero");
    await expect(page.getByRole("row")).toHaveCount(2, { timeout: 10000 });

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "PDF" }).click(),
    ]);
    await download.path();

    await expect(page.getByRole("row")).toHaveCount(2);
    await expect(page.getByLabel("Buscar roles")).toHaveValue("Bodeguero");
  });
});

test.describe("Roles RBAC and multi-tenant isolation", () => {
  test("authorized user (Administrador, roles.gestionar) sees the nav link and the management UI", async ({
    page,
  }) => {
    await login(page);
    await expect(page.getByRole("link", { name: "Roles" })).toBeVisible();
    await page.getByRole("link", { name: "Roles" }).click();
    await waitForRolesLoaded(page);
    await expect(page.getByRole("button", { name: "Nuevo Rol" })).toBeVisible();
    await expect(page.getByRole("row").nth(1).getByRole("button", { name: "Acciones" })).toBeVisible();
  });

  test("unauthorized user (Supervisor, no roles.* permission) has no nav link and is blocked from /roles", async ({
    page,
  }) => {
    await login(page, "qa-rbac-supervisor@example.com", QA_PASSWORD);
    await expect(page.getByRole("link", { name: "Roles" })).toHaveCount(0);

    // Direct access by URL — the frontend gate, not just a hidden nav link.
    await page.goto("/roles");
    await expect(page.getByText("No tienes permiso para ver este módulo.")).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("table")).toHaveCount(0);
    // The export buttons live inside the gated page body — never rendered for this user.
    await expect(page.getByRole("button", { name: "CSV" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "PDF" })).toHaveCount(0);
  });

  test("multi-tenant: Empresa B's Administrador only sees Empresa B's roles", async ({ page }) => {
    await login(page, "qa-rbac-admin-b@example.com", QA_PASSWORD);
    await page.goto("/roles");
    await waitForRolesLoaded(page);

    await page.getByLabel("Filtrar por estado").click();
    await page.getByRole("option", { name: "Todos", exact: true }).click();
    // Empresa A carries ~200+ pre-existing "E2E ..." rows (see report) plus its 5 seeded
    // roles; Empresa B only ever had its own 5 seeded roles. None of Empresa A's data
    // (by name or by count) should leak across the tenant boundary.
    await expect(page.getByText(/5 resultados? · página 1 de 1/)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/^E2E /)).toHaveCount(0);
  });

  test("multi-tenant: Empresa B's Administrador exports only Empresa B's roles", async ({ page }) => {
    await login(page, "qa-rbac-admin-b@example.com", QA_PASSWORD);
    await page.goto("/roles");
    await waitForRolesLoaded(page);

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "CSV" }).click(),
    ]);

    const filePath = await download.path();
    const contenido = fs.readFileSync(filePath, "utf-8");
    const filas = contenido.trim().split("\n");
    expect(filas).toHaveLength(6); // header + Empresa B's 5 real seeded roles
    expect(contenido).not.toContain("E2E ");
  });
});
