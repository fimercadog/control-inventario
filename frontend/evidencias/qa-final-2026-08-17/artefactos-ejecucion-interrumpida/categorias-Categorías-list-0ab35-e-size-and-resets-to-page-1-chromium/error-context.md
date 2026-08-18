# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: categorias.spec.ts >> Categorías list >> changes page size and resets to page 1
- Location: tests\categorias.spec.ts:60:7

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  getByRole('row')
Expected: 11
Received: 2
Timeout:  5000ms

Call log:
  - Expect "toHaveCount" with timeout 5000ms
  - waiting for getByRole('row')
    14 × locator resolved to 2 elements
       - unexpected value "2"

```

# Page snapshot

```yaml
- generic [ref=f1e1]:
  - button "Open Next.js Dev Tools" [ref=f1e7] [cursor=pointer]
  - alert [ref=f1e11]
  - generic [ref=f1e12]:
    - complementary [ref=f1e13]:
      - generic [ref=f1e14]: FidelOS
      - button "Modo Contingencia" [ref=f1e16]
      - navigation "Navegación principal" [ref=f1e17]:
        - generic [ref=f1e18]:
          - generic [ref=f1e19]: General
          - link "Dashboard" [ref=f1e20] [cursor=pointer]:
            - /url: /dashboard
          - link "Reportes" [ref=f1e26] [cursor=pointer]:
            - /url: /reportes
          - link "Captura IA" [ref=f1e29] [cursor=pointer]:
            - /url: /captura-ia
        - generic [ref=f1e33]:
          - generic [ref=f1e34]: Inventario
          - link "Productos" [ref=f1e35] [cursor=pointer]:
            - /url: /productos
          - link "Categorías" [ref=f1e40] [cursor=pointer]:
            - /url: /categorias
          - link "Marcas" [ref=f1e44] [cursor=pointer]:
            - /url: /marcas
          - link "Unidades de Medida" [ref=f1e48] [cursor=pointer]:
            - /url: /unidades
          - link "Stock" [ref=f1e55] [cursor=pointer]:
            - /url: /stock
          - link "Movimientos" [ref=f1e66] [cursor=pointer]:
            - /url: /movimientos
        - generic [ref=f1e72]:
          - generic [ref=f1e73]: Terceros
          - link "Proveedores" [ref=f1e74] [cursor=pointer]:
            - /url: /proveedores
          - link "Clientes" [ref=f1e80] [cursor=pointer]:
            - /url: /clientes
        - generic [ref=f1e85]:
          - generic [ref=f1e86]: Administración
          - link "Usuarios" [ref=f1e87] [cursor=pointer]:
            - /url: /usuarios
          - link "Roles" [ref=f1e93] [cursor=pointer]:
            - /url: /roles
          - link "Auditoría" [ref=f1e96] [cursor=pointer]:
            - /url: /auditoria
    - generic [ref=f1e100]:
      - banner [ref=f1e101]:
        - generic [ref=f1e102]: Hola, Test
        - button "TU Test User QA Verified Administrador" [ref=f1e104]:
          - generic [ref=f1e105]: TU
          - generic [ref=f1e107]:
            - generic [ref=f1e108]: Test User QA Verified
            - generic [ref=f1e109]: Administrador
      - main [ref=f1e110]:
        - generic [ref=f1e111]:
          - generic [ref=f1e112]:
            - generic [ref=f1e113]:
              - heading "Categorías" [level=1] [ref=f1e114]
              - paragraph [ref=f1e115]: Gestiona las categorías de productos de tu empresa.
            - button "Nueva Categoría" [ref=f1e116]
          - generic [ref=f1e117]:
            - generic [ref=f1e118]:
              - button "CSV" [ref=f1e119]
              - button "PDF" [ref=f1e120]
            - textbox "Buscar categorías" [ref=f1e125]:
              - /placeholder: Buscar por nombre o descripción…
            - combobox "Filtrar por estado" [ref=f1e126]:
              - generic [ref=f1e127]: Activas
              - img: ▼
            - textbox [ref=f1e128]: activo
          - generic [ref=f1e129]:
            - table [ref=f1e132]:
              - rowgroup [ref=f1e133]:
                - row [ref=f1e134]:
                  - columnheader "#" [ref=f1e135]
                  - columnheader "Nombre" [ref=f1e136]
                  - columnheader "Estado" [ref=f1e137]
                  - columnheader "Productos" [ref=f1e138]
                  - columnheader "Acciones" [ref=f1e139]
              - rowgroup [ref=f1e140]:
                - row [ref=f1e141]:
                  - cell "Cargando…" [ref=f1e142]
            - generic [ref=f1e146]:
              - paragraph [ref=f1e147]: 403 resultados · página 1 de 5
              - generic [ref=f1e148]:
                - generic [ref=f1e149]:
                  - generic [ref=f1e150]: Filas por página
                  - combobox "Filas por página" [active] [ref=f1e151]:
                    - generic [ref=f1e152]: "100"
                    - img: ▼
                  - textbox [ref=f1e153]: "100"
                - generic [ref=f1e154]:
                  - button "Página anterior" [disabled]
                  - button "Página siguiente" [disabled]
```

# Test source

```ts
  1   | import fs from "node:fs";
  2   | import { test, expect, type Page } from "@playwright/test";
  3   | import { login } from "./helpers";
  4   | 
  5   | const QA_PASSWORD = "Qa-Rbac-2026!";
  6   | 
  7   | /** Waits for the list's initial fetch to settle before a test starts interacting with it. */
  8   | async function waitForCategoriasLoaded(page: Page) {
  9   |   await expect(page.getByRole("heading", { name: "Categorías" })).toBeVisible();
  10  |   await expect(page.getByText("Cargando…")).not.toBeVisible({ timeout: 15000 });
  11  | }
  12  | 
  13  | test.describe("Categorías list", () => {
  14  |   test.beforeEach(async ({ page }) => {
  15  |     await login(page);
  16  |     await page.goto("/categorias");
  17  |     await waitForCategoriasLoaded(page);
  18  |   });
  19  | 
  20  |   test("lists real categories from the backend with numbered rows and product counts", async ({ page }) => {
  21  |     await expect(page.getByRole("table")).toBeVisible();
  22  |     const firstRow = page.getByRole("row").nth(1);
  23  |     await expect(firstRow.getByRole("cell").first()).toHaveText("1");
  24  |     // "Accesorios" sorts first alphabetically and is real, seeded, permanent data.
  25  |     await expect(firstRow.getByText("Accesorios")).toBeVisible();
  26  |     await expect(page.getByText(/resultados? · página 1 de/)).toBeVisible();
  27  |   });
  28  | 
  29  |   test("typing fewer than 3 characters does not trigger a search", async ({ page }) => {
  30  |     const rowCountBefore = await page.getByRole("row").count();
  31  |     await page.getByLabel("Buscar categorías").fill("ac");
  32  |     await page.waitForTimeout(700);
  33  |     await expect(page.getByRole("row")).toHaveCount(rowCountBefore);
  34  |   });
  35  | 
  36  |   test("typing 3+ characters filters the table by nombre", async ({ page }) => {
  37  |     await page.getByLabel("Buscar categorías").fill("zzzzznoexiste");
  38  |     await expect(page.getByText("No se encontraron categorías.")).toBeVisible({ timeout: 10000 });
  39  |     await page.getByLabel("Buscar categorías").fill("");
  40  |     await expect(page.getByText("No se encontraron categorías.")).not.toBeVisible();
  41  |   });
  42  | 
  43  |   test("search also matches on descripcion, not just nombre", async ({ page }) => {
  44  |     // Confirmed against the real backend: CategoriaController::index() searches
  45  |     // `nombre LIKE` OR `descripcion LIKE`. "Mollitia" appears only in the real seeded
  46  |     // description of "Alimento para gatos" (verified: 0 nombre matches, 1 descripcion
  47  |     // match) — a hit here proves the descripcion field is actually searched, not just
  48  |     // nombre like Roles' equivalent search.
  49  |     await page.getByLabel("Buscar categorías").fill("Mollitia");
  50  |     await expect(page.getByRole("row")).toHaveCount(2, { timeout: 10000 });
  51  |     await expect(page.getByRole("row").filter({ hasText: "Alimento para gatos" })).toBeVisible();
  52  |   });
  53  | 
  54  |   test("filters by estado", async ({ page }) => {
  55  |     await page.getByLabel("Filtrar por estado").click();
  56  |     await page.getByRole("option", { name: "Todas", exact: true }).click();
  57  |     await expect(page.getByText(/resultados? · página/)).toBeVisible({ timeout: 10000 });
  58  |   });
  59  | 
  60  |   test("changes page size and resets to page 1", async ({ page }) => {
  61  |     await page.getByLabel("Filas por página").click();
  62  |     await page.getByRole("option", { name: "10", exact: true }).click();
  63  |     await expect(page.getByText(/· página 1 de/)).toBeVisible({ timeout: 10000 });
> 64  |     await expect(page.getByRole("row")).toHaveCount(11); // header + 10 data rows
      |                                         ^ Error: expect(locator).toHaveCount(expected) failed
  65  |   });
  66  | 
  67  |   test("navigates to the next page", async ({ page }) => {
  68  |     await page.getByLabel("Filas por página").click();
  69  |     await page.getByRole("option", { name: "10", exact: true }).click();
  70  |     await expect(page.getByText(/· página 1 de/)).toBeVisible({ timeout: 10000 });
  71  |     await page.getByLabel("Página siguiente").click();
  72  |     await expect(page.getByText(/· página 2 de/)).toBeVisible({ timeout: 10000 });
  73  |     const firstCell = page.getByRole("row").nth(1).getByRole("cell").first();
  74  |     await expect(firstCell).toHaveText("11");
  75  |   });
  76  | 
  77  |   test("Ver opens a modal with the category's real details, not a page navigation", async ({ page }) => {
  78  |     await page.getByLabel("Buscar categorías").fill("Accesorios");
  79  |     await expect(page.getByRole("row")).toHaveCount(2, { timeout: 10000 });
  80  |     const row = page.getByRole("row").filter({ hasText: "Accesorios" });
  81  |     await row.getByRole("button", { name: "Acciones" }).click();
  82  |     await page.getByRole("menuitem", { name: "Ver" }).click();
  83  | 
  84  |     const dialog = page.getByRole("dialog");
  85  |     await expect(dialog.getByText("Accesorios", { exact: true })).toBeVisible();
  86  |     await expect(dialog.getByText("Activo")).toBeVisible();
  87  |     await expect(dialog.getByText("Productos asociados")).toBeVisible();
  88  |     await expect(dialog.getByRole("button", { name: "Editar" })).toBeVisible();
  89  |     await expect(dialog.getByRole("button", { name: /^(Deshabilitar|Habilitar)$/ })).toBeVisible();
  90  |     await expect(page).toHaveURL(/\/categorias(\?.*)?$/);
  91  |   });
  92  | 
  93  |   test("clicking a category's name also opens the Ver modal", async ({ page }) => {
  94  |     await page.getByLabel("Buscar categorías").fill("Accesorios");
  95  |     await expect(page.getByRole("row")).toHaveCount(2, { timeout: 10000 });
  96  |     await page.getByRole("row").filter({ hasText: "Accesorios" }).getByRole("button").first().click();
  97  |     await expect(page.getByRole("dialog").getByText("Accesorios", { exact: true })).toBeVisible();
  98  |   });
  99  | 
  100 |   test("Ver modal's Productos tab lists the category's real associated products, read-only", async ({ page }) => {
  101 |     await page.getByLabel("Buscar categorías").fill("Accesorios");
  102 |     await expect(page.getByRole("row")).toHaveCount(2, { timeout: 10000 });
  103 |     await page.getByRole("row").filter({ hasText: "Accesorios" }).getByRole("button").first().click();
  104 | 
  105 |     const dialog = page.getByRole("dialog");
  106 |     await dialog.getByRole("tab", { name: "Productos" }).click();
  107 |     // Accesorios has real associated products in the shared demo dataset — assert
  108 |     // presence, not an exact count, since that count is shared/mutable state.
  109 |     await expect(dialog.getByRole("listitem").first()).toBeVisible({ timeout: 10000 });
  110 |     // Read-only: no action buttons anywhere in this tab.
  111 |     await expect(dialog.getByRole("button", { name: /Editar|Deshabilitar|Habilitar/ })).toHaveCount(0);
  112 |   });
  113 | 
  114 |   test("disabling a category with associated products succeeds — no blocking guard exists for Categorías", async ({
  115 |     page,
  116 |   }) => {
  117 |     // Deliberate, confirmed difference from Roles: RoleService blocks deactivating a role
  118 |     // with assigned users (409); CategoriaController explicitly documents the opposite —
  119 |     // categoria_id on productos is nullable and never nulled on disable, so disabling a
  120 |     // populated category is safe by design. Restored immediately after (real shared data).
  121 |     // Uses "Antipulgas y garrapatas" (29 real products), not "Accesorios" — Accesorios is
  122 |     // read by four other tests in this file, and fullyParallel:true runs tests within a
  123 |     // file concurrently across workers, so toggling a record other tests are reading at
  124 |     // the same time is a real, previously-hit race (a concurrent reader can catch it
  125 |     // mid-toggle, filtered out by the default estado=activo search). A dedicated,
  126 |     // otherwise-unreferenced record sidesteps the race entirely rather than serializing
  127 |     // the tests to work around it.
  128 |     await page.getByLabel("Buscar categorías").fill("Antipulgas y garrapatas");
  129 |     await expect(page.getByRole("row")).toHaveCount(2, { timeout: 10000 });
  130 |     const row = page.getByRole("row").filter({ hasText: "Antipulgas y garrapatas" });
  131 |     await row.getByRole("button").first().click();
  132 | 
  133 |     const dialog = page.getByRole("dialog");
  134 |     await dialog.getByRole("button", { name: "Deshabilitar" }).click();
  135 |     await expect(dialog.getByText("Inactivo")).toBeVisible({ timeout: 10000 });
  136 | 
  137 |     await dialog.getByRole("button", { name: "Habilitar" }).click();
  138 |     await expect(dialog.getByText("Activo")).toBeVisible({ timeout: 10000 });
  139 |   });
  140 | 
  141 |   test("is responsive: sidebar becomes a sheet on mobile viewport", async ({ page }) => {
  142 |     await page.setViewportSize({ width: 375, height: 812 });
  143 |     await expect(page.getByRole("button", { name: "Abrir menú" })).toBeVisible();
  144 |     await page.getByRole("button", { name: "Abrir menú" }).click();
  145 |     await expect(page.getByRole("link", { name: "Categorías" })).toBeVisible();
  146 |   });
  147 | 
  148 |   test("Nueva Categoría opens a modal with real backend-driven fields and validates the required name", async ({
  149 |     page,
  150 |   }) => {
  151 |     await page.getByRole("button", { name: "Nueva Categoría" }).click();
  152 |     const dialog = page.getByRole("dialog");
  153 |     await expect(dialog.getByRole("heading", { name: "Nueva Categoría" })).toBeVisible();
  154 |     await expect(dialog.getByLabel("Nombre")).toBeVisible();
  155 |     await expect(dialog.getByLabel("Descripción")).toBeVisible();
  156 | 
  157 |     // Pure client-side zod validation — no network call, nothing created.
  158 |     await dialog.getByRole("button", { name: "Crear categoría" }).click();
  159 |     await expect(dialog.getByText("El nombre es obligatorio.")).toBeVisible();
  160 |   });
  161 | 
  162 |   test("Nueva Categoría sends nombre and descripcion in the request payload", async ({ page }) => {
  163 |     // Intercepted and fulfilled locally instead of hitting the real backend:
  164 |     // CategoriaController has no destroy endpoint (physical delete is never allowed,
```