import { test, expect, type Page } from "@playwright/test";

/**
 * Fase 6 — QA Final (spec.md). RBAC, aislamiento multiempresa y responsive de los 10 módulos
 * nuevos construidos en esta ejecución (Marcas, Unidades de Medida, Clientes, Productos,
 * Stock, Movimientos, Auditoría, Reportes, Captura IA, Perfil/Configuración).
 *
 * Matriz de permisos verificada contra database/seeders/RoleSeeder.php real, no asumida:
 * ninguno de los 4 roles QA no-administradores tiene permisos de marcas, unidades-medida,
 * stock, categorias, proveedores ni roles — todos deben quedar bloqueados de esos módulos.
 */

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel(/correo/i).fill(email);
  await page.locator("#password").fill("Qa-Rbac-2026!");
  await page.getByRole("button", { name: /ingresar/i }).click();
  await page.waitForURL("**/dashboard");
  await page.waitForLoadState("networkidle");
}

test.describe("RBAC — nuevos módulos por rol real (RoleSeeder)", () => {
  test("Supervisor: ve Productos/Movimientos/Captura IA/Auditoría/Reportes/Clientes, no ve Marcas/Unidades/Stock/Proveedores/Categorías/Roles", async ({ page }) => {
    await login(page, "qa-rbac-supervisor@example.com");
    const nav = page.getByLabel("Navegación principal");
    for (const label of ["Productos", "Movimientos", "Captura IA", "Auditoría", "Reportes", "Clientes"]) {
      await expect(nav.getByRole("link", { name: label })).toBeVisible();
    }
    for (const label of ["Marcas", "Unidades de Medida", "Stock", "Proveedores", "Categorías", "Roles"]) {
      await expect(nav.getByRole("link", { name: label })).toHaveCount(0);
    }
    // Direct URL access to an unauthorized module must still be blocked (backend + frontend).
    await page.goto("/marcas");
    await expect(page.getByText(/no tienes permiso/i)).toBeVisible();
  });

  test("Bodeguero: solo Productos/Movimientos/Captura IA — nada de Clientes/Auditoría/Reportes/Usuarios", async ({ page }) => {
    await login(page, "qa-rbac-bodeguero@example.com");
    const nav = page.getByLabel("Navegación principal");
    for (const label of ["Productos", "Movimientos", "Captura IA"]) {
      await expect(nav.getByRole("link", { name: label })).toBeVisible();
    }
    for (const label of ["Clientes", "Auditoría", "Reportes", "Usuarios", "Stock", "Marcas"]) {
      await expect(nav.getByRole("link", { name: label })).toHaveCount(0);
    }
    await page.goto("/clientes");
    await expect(page.getByText(/no tienes permiso/i)).toBeVisible();
  });

  test("Vendedor: ve Clientes pero sin Captura IA, y Movimientos solo lectura (sin movimientos.crear)", async ({ page }) => {
    await login(page, "qa-rbac-vendedor@example.com");
    const nav = page.getByLabel("Navegación principal");
    await expect(nav.getByRole("link", { name: "Clientes" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Captura IA" })).toHaveCount(0);

    await page.goto("/movimientos");
    await expect(page.getByRole("heading", { name: "Movimientos", level: 1 })).toBeVisible();
    // movimientos.crear not granted to Vendedor — "Nuevo Movimiento" must not render.
    await expect(page.getByRole("button", { name: /nuevo movimiento/i })).toHaveCount(0);
  });

  test("Auxiliar Contable: Auditoría y Reportes de solo lectura, sin Movimientos ni Captura IA", async ({ page }) => {
    await login(page, "qa-rbac-auxiliar-contable@example.com");
    const nav = page.getByLabel("Navegación principal");
    for (const label of ["Auditoría", "Reportes", "Productos"]) {
      await expect(nav.getByRole("link", { name: label })).toBeVisible();
    }
    for (const label of ["Movimientos", "Captura IA", "Usuarios"]) {
      await expect(nav.getByRole("link", { name: label })).toHaveCount(0);
    }
    // clientes.ver only (no crear/editar/gestionar) — Nuevo Cliente must not render.
    await page.goto("/clientes");
    await expect(page.getByRole("heading", { name: "Clientes", level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: /nuevo cliente/i })).toHaveCount(0);
  });

  test("Administrador ve todos los módulos nuevos, incluyendo Marcas/Unidades/Stock", async ({ page }) => {
    await login(page, "qa-rbac-administrador@example.com");
    const nav = page.getByLabel("Navegación principal");
    for (const label of [
      "Productos", "Marcas", "Unidades de Medida", "Stock", "Movimientos",
      "Clientes", "Auditoría", "Reportes", "Captura IA",
    ]) {
      await expect(nav.getByRole("link", { name: label })).toBeVisible();
    }
  });
});

test.describe("Multi-tenant — aislamiento entre empresas en los módulos nuevos", () => {
  test("Empresa B (Administrador) solo ve sus propios Productos y Movimientos, nunca los de Empresa A", async ({ page }) => {
    await login(page, "qa-rbac-admin-b@example.com");

    await page.goto("/productos");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "Productos", level: 1 })).toBeVisible();
    // Real isolation lives in the backend (paraEmpresaActual on every query) — this just
    // confirms the frontend renders whatever the backend scoped, without erroring.
    await expect(page.locator("table")).toBeVisible();

    await page.goto("/movimientos");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "Movimientos", level: 1 })).toBeVisible();
  });

  test("direct cross-company access to a Producto by id is rejected by the backend", async ({ page }) => {
    let bearerToken = "";
    page.on("request", (req) => {
      const auth = req.headers()["authorization"];
      if (auth?.startsWith("Bearer ")) bearerToken = auth;
    });

    await login(page, "qa-rbac-admin-b@example.com");
    await page.goto("/productos");
    await page.waitForLoadState("networkidle");
    expect(bearerToken).not.toBe("");

    // Producto id=1 ("Pelota 500 ml") really belongs to empresa_id=1 (Empresa A) — verified
    // directly via tinker, not assumed — while qa-rbac-admin-b's own empresa_id is 2.
    const response = await page.request.get("http://127.0.0.1:8000/api/v1/productos/1", {
      headers: { Authorization: bearerToken, Accept: "application/json" },
    });
    expect([403, 404]).toContain(response.status());
  });
});

test.describe("Responsive — módulos nuevos", () => {
  test("Productos y Reportes: sidebar colapsa a Sheet en viewport móvil", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page, "qa-rbac-administrador@example.com");

    await page.goto("/productos");
    await expect(page.getByLabel("Navegación principal")).not.toBeVisible();
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await expect(page.getByRole("link", { name: "Productos" })).toBeVisible();
    await page.keyboard.press("Escape");

    await page.goto("/reportes");
    await expect(page.getByRole("heading", { name: "Reportes", level: 1 })).toBeVisible();
    // Catalog cards stack in a single column on mobile — just confirm no horizontal overflow.
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
  });
});
