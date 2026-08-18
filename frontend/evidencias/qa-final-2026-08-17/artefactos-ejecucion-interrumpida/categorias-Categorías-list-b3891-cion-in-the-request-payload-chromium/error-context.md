# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: categorias.spec.ts >> Categorías list >> Nueva Categoría sends nombre and descripcion in the request payload
- Location: tests\categorias.spec.ts:162:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Categorías' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: 'Categorías' })

```

```yaml
- main:
  - img "Cargando"
- alert
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
> 9   |   await expect(page.getByRole("heading", { name: "Categorías" })).toBeVisible();
      |                                                                   ^ Error: expect(locator).toBeVisible() failed
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
  64  |     await expect(page.getByRole("row")).toHaveCount(11); // header + 10 data rows
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
```