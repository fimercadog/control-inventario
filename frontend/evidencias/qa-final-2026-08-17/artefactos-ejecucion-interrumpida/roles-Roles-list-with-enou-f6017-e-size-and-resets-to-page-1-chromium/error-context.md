# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: roles.spec.ts >> Roles list >> with enough roles for a second page >> changes page size and resets to page 1
- Location: tests\roles.spec.ts:140:9

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
```

# Page snapshot

```yaml
- generic [active] [ref=f2e1]:
  - button "Open Next.js Dev Tools" [ref=f2e7] [cursor=pointer]
  - alert [ref=f2e11]
  - generic [ref=f2e12]:
    - complementary [ref=f2e13]:
      - generic [ref=f2e14]: FidelOS
      - button "Modo Contingencia" [ref=f2e16]
      - navigation "Navegación principal" [ref=f2e17]:
        - generic [ref=f2e18]:
          - generic [ref=f2e19]: General
          - link "Dashboard" [ref=f2e20] [cursor=pointer]:
            - /url: /dashboard
          - link "Reportes" [ref=f2e26] [cursor=pointer]:
            - /url: /reportes
          - link "Captura IA" [ref=f2e29] [cursor=pointer]:
            - /url: /captura-ia
        - generic [ref=f2e33]:
          - generic [ref=f2e34]: Inventario
          - link "Productos" [ref=f2e35] [cursor=pointer]:
            - /url: /productos
          - link "Categorías" [ref=f2e40] [cursor=pointer]:
            - /url: /categorias
          - link "Marcas" [ref=f2e44] [cursor=pointer]:
            - /url: /marcas
          - link "Unidades de Medida" [ref=f2e48] [cursor=pointer]:
            - /url: /unidades
          - link "Stock" [ref=f2e55] [cursor=pointer]:
            - /url: /stock
          - link "Movimientos" [ref=f2e66] [cursor=pointer]:
            - /url: /movimientos
        - generic [ref=f2e72]:
          - generic [ref=f2e73]: Terceros
          - link "Proveedores" [ref=f2e74] [cursor=pointer]:
            - /url: /proveedores
          - link "Clientes" [ref=f2e80] [cursor=pointer]:
            - /url: /clientes
        - generic [ref=f2e85]:
          - generic [ref=f2e86]: Administración
          - link "Usuarios" [ref=f2e87] [cursor=pointer]:
            - /url: /usuarios
          - link "Roles" [ref=f2e93] [cursor=pointer]:
            - /url: /roles
          - link "Auditoría" [ref=f2e96] [cursor=pointer]:
            - /url: /auditoria
    - generic [ref=f2e100]:
      - banner [ref=f2e101]:
        - generic [ref=f2e102]: Hola, Test
        - button "TU Test User QA Verified Administrador" [ref=f2e104]:
          - generic [ref=f2e105]: TU
          - generic [ref=f2e107]:
            - generic [ref=f2e108]: Test User QA Verified
            - generic [ref=f2e109]: Administrador
      - main [ref=f2e110]:
        - generic [ref=f2e111]:
          - generic [ref=f2e112]:
            - generic [ref=f2e113]:
              - heading "Roles" [level=1] [ref=f2e114]
              - paragraph [ref=f2e115]: Gestiona los roles y permisos de tu empresa.
            - button "Nuevo Rol" [ref=f2e116]
          - generic [ref=f2e117]:
            - generic [ref=f2e118]:
              - button "CSV" [ref=f2e119]
              - button "PDF" [ref=f2e120]
            - textbox "Buscar roles" [ref=f2e125]:
              - /placeholder: Buscar por nombre…
            - combobox "Filtrar por estado" [ref=f2e126]:
              - generic [ref=f2e127]: Activos
              - img: ▼
            - textbox [ref=f2e128]: activo
          - generic [ref=f2e129]:
            - table [ref=f2e132]:
              - rowgroup [ref=f2e133]:
                - row [ref=f2e134]:
                  - columnheader "#" [ref=f2e135]
                  - columnheader "Nombre" [ref=f2e136]
                  - columnheader "Estado" [ref=f2e137]
                  - columnheader "Permisos" [ref=f2e138]
                  - columnheader "Usuarios" [ref=f2e139]
                  - columnheader "Acciones" [ref=f2e140]
              - rowgroup [ref=f2e141]:
                - row [ref=f2e142]:
                  - cell "1" [ref=f2e143]
                  - cell [ref=f2e144]:
                    - button "Administrador" [ref=f2e145]
                  - cell "Activo" [ref=f2e146]
                  - cell "47" [ref=f2e148]
                  - cell "28" [ref=f2e149]
                  - cell [ref=f2e150]:
                    - button "Acciones" [ref=f2e151]
                - row [ref=f2e152]:
                  - cell "2" [ref=f2e153]
                  - cell [ref=f2e154]:
                    - button "Auxiliar Contable" [ref=f2e155]
                  - cell "Activo" [ref=f2e156]
                  - cell "4" [ref=f2e158]
                  - cell "6" [ref=f2e159]
                  - cell [ref=f2e160]:
                    - button "Acciones" [ref=f2e161]
                - row [ref=f2e162]:
                  - cell "3" [ref=f2e163]
                  - cell [ref=f2e164]:
                    - button "Bodeguero" [ref=f2e165]
                  - cell "Activo" [ref=f2e166]
                  - cell "5" [ref=f2e168]
                  - cell "7" [ref=f2e169]
                  - cell [ref=f2e170]:
                    - button "Acciones" [ref=f2e171]
                - row [ref=f2e172]:
                  - cell "4" [ref=f2e173]
                  - cell [ref=f2e174]:
                    - button "Rol de prueba (paginación) 1" [ref=f2e175]
                  - cell "Activo" [ref=f2e176]
                  - cell "0" [ref=f2e178]
                  - cell "0" [ref=f2e179]
                  - cell [ref=f2e180]:
                    - button "Acciones" [ref=f2e181]
                - row [ref=f2e182]:
                  - cell "5" [ref=f2e183]
                  - cell [ref=f2e184]:
                    - button "Rol de prueba (paginación) 2" [ref=f2e185]
                  - cell "Activo" [ref=f2e186]
                  - cell "0" [ref=f2e188]
                  - cell "0" [ref=f2e189]
                  - cell [ref=f2e190]:
                    - button "Acciones" [ref=f2e191]
                - row [ref=f2e192]:
                  - cell "6" [ref=f2e193]
                  - cell [ref=f2e194]:
                    - button "Rol de prueba (paginación) 3" [ref=f2e195]
                  - cell "Activo" [ref=f2e196]
                  - cell "0" [ref=f2e198]
                  - cell "0" [ref=f2e199]
                  - cell [ref=f2e200]:
                    - button "Acciones" [ref=f2e201]
                - row [ref=f2e202]:
                  - cell "7" [ref=f2e203]
                  - cell [ref=f2e204]:
                    - button "Rol de prueba (paginación) 4" [ref=f2e205]
                  - cell "Activo" [ref=f2e206]
                  - cell "0" [ref=f2e208]
                  - cell "0" [ref=f2e209]
                  - cell [ref=f2e210]:
                    - button "Acciones" [ref=f2e211]
                - row [ref=f2e212]:
                  - cell "8" [ref=f2e213]
                  - cell [ref=f2e214]:
                    - button "Rol de prueba (paginación) 5" [ref=f2e215]
                  - cell "Activo" [ref=f2e216]
                  - cell "0" [ref=f2e218]
                  - cell "0" [ref=f2e219]
                  - cell [ref=f2e220]:
                    - button "Acciones" [ref=f2e221]
                - row [ref=f2e222]:
                  - cell "9" [ref=f2e223]
                  - cell [ref=f2e224]:
                    - button "Rol de prueba (paginación) 6" [ref=f2e225]
                  - cell "Activo" [ref=f2e226]
                  - cell "0" [ref=f2e228]
                  - cell "0" [ref=f2e229]
                  - cell [ref=f2e230]:
                    - button "Acciones" [ref=f2e231]
                - row [ref=f2e232]:
                  - cell "10" [ref=f2e233]
                  - cell [ref=f2e234]:
                    - button "Rol de prueba (paginación) 7" [ref=f2e235]
                  - cell "Activo" [ref=f2e236]
                  - cell "0" [ref=f2e238]
                  - cell "0" [ref=f2e239]
                  - cell [ref=f2e240]:
                    - button "Acciones" [ref=f2e241]
                - row [ref=f2e242]:
                  - cell "11" [ref=f2e243]
                  - cell [ref=f2e244]:
                    - button "Supervisor" [ref=f2e245]
                  - cell "Activo" [ref=f2e246]
                  - cell "16" [ref=f2e248]
                  - cell "6" [ref=f2e249]
                  - cell [ref=f2e250]:
                    - button "Acciones" [ref=f2e251]
                - row [ref=f2e252]:
                  - cell "12" [ref=f2e253]
                  - cell [ref=f2e254]:
                    - button "Vendedor" [ref=f2e255]
                  - cell "Activo" [ref=f2e256]
                  - cell "5" [ref=f2e258]
                  - cell "4" [ref=f2e259]
                  - cell [ref=f2e260]:
                    - button "Acciones" [ref=f2e261]
            - generic [ref=f2e262]:
              - paragraph [ref=f2e263]: 12 resultados · página 1 de 1
              - generic [ref=f2e264]:
                - generic [ref=f2e265]:
                  - generic [ref=f2e266]: Filas por página
                  - combobox "Filas por página" [ref=f2e267]:
                    - generic [ref=f2e268]: "20"
                    - img: ▼
                  - textbox [ref=f2e269]: "20"
                - generic [ref=f2e270]:
                  - button "Página anterior" [disabled]
                  - button "Página siguiente" [disabled]
```

# Test source

```ts
  27  | ): Promise<{ ids: number[]; token: string }> {
  28  |   const loginRes = await request.post("/api/v1/auth/login", {
  29  |     data: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
  30  |   });
  31  |   const { access_token: token } = (await loginRes.json()).data;
  32  |   const headers = { Authorization: `Bearer ${token}` };
  33  | 
  34  |   const existingRes = await request.get("/api/v1/roles", {
  35  |     headers,
  36  |     params: { busqueda: "Rol de prueba (paginación)", estado: "todos", per_page: 100 },
  37  |   });
  38  |   const existingByName = new Map<string, number>(
  39  |     ((await existingRes.json()).data.items as Array<{ id: number; name: string }>).map((r) => [r.name, r.id])
  40  |   );
  41  | 
  42  |   const ids: number[] = [];
  43  |   for (let i = 1; i <= count; i++) {
  44  |     const name = `Rol de prueba (paginación) ${i}`;
  45  |     const existingId = existingByName.get(name);
  46  |     if (existingId) {
  47  |       await request.post(`/api/v1/roles/${existingId}/activar`, { headers });
  48  |       ids.push(existingId);
  49  |     } else {
  50  |       const res = await request.post("/api/v1/roles", { headers, data: { name } });
  51  |       ids.push((await res.json()).data.id);
  52  |     }
  53  |   }
  54  |   return { ids, token };
  55  | }
  56  | 
  57  | async function deactivatePaginationFixtureRoles(request: APIRequestContext, token: string, ids: number[]): Promise<void> {
  58  |   for (const id of ids) {
  59  |     await request.post(`/api/v1/roles/${id}/desactivar`, {
  60  |       headers: { Authorization: `Bearer ${token}` },
  61  |     });
  62  |   }
  63  | }
  64  | 
  65  | /** Waits for the list's initial fetch to settle before a test starts interacting with it. */
  66  | async function waitForRolesLoaded(page: Page) {
  67  |   await expect(page.getByRole("heading", { name: "Roles" })).toBeVisible();
  68  |   await expect(page.getByText("Cargando…")).not.toBeVisible({ timeout: 15000 });
  69  | }
  70  | 
  71  | /**
  72  |  * The permission catalog's checkbox is a base-ui custom `role="checkbox"` element; the
  73  |  * `id="perm-{permission}"` prop actually lands on a visually-hidden native input used only
  74  |  * for label association (confirmed via DOM inspection), not on the interactive element
  75  |  * itself. The real, clickable `role="checkbox"` is that hidden input's sibling within the
  76  |  * same wrapper — this locates it deterministically regardless of visible label text, which
  77  |  * repeats across modules (many groups have their own "ver"/"crear"/"editar" permission).
  78  |  */
  79  | function permissionCheckbox(scope: Locator, permission: string) {
  80  |   return scope.locator(`[id="perm-${permission}"]`).locator("xpath=..").getByRole("checkbox");
  81  | }
  82  | 
  83  | test.describe("Roles list", () => {
  84  |   test.beforeEach(async ({ page }) => {
  85  |     await login(page);
  86  |     await page.goto("/roles");
  87  |     await waitForRolesLoaded(page);
  88  |   });
  89  | 
  90  |   test("lists real roles from the backend with numbered rows and permission/user counts", async ({ page }) => {
  91  |     await expect(page.getByRole("table")).toBeVisible();
  92  |     const firstRow = page.getByRole("row").nth(1);
  93  |     await expect(firstRow.getByRole("cell").first()).toHaveText("1");
  94  |     // Administrador sorts first alphabetically and is real, seeded, permanent data.
  95  |     await expect(firstRow.getByText("Administrador")).toBeVisible();
  96  |     await expect(page.getByText(/resultados? · página 1 de/)).toBeVisible();
  97  |   });
  98  | 
  99  |   test("typing fewer than 3 characters does not trigger a search", async ({ page }) => {
  100 |     const rowCountBefore = await page.getByRole("row").count();
  101 |     await page.getByLabel("Buscar roles").fill("ad");
  102 |     await page.waitForTimeout(700);
  103 |     await expect(page.getByRole("row")).toHaveCount(rowCountBefore);
  104 |   });
  105 | 
  106 |   test("typing 3+ characters filters the table", async ({ page }) => {
  107 |     await page.getByLabel("Buscar roles").fill("zzzzznoexiste");
  108 |     await expect(page.getByText("No se encontraron roles.")).toBeVisible({ timeout: 10000 });
  109 |     await page.getByLabel("Buscar roles").fill("");
  110 |     await expect(page.getByText("No se encontraron roles.")).not.toBeVisible();
  111 |   });
  112 | 
  113 |   test("filters by estado", async ({ page }) => {
  114 |     await page.getByLabel("Filtrar por estado").click();
  115 |     await page.getByRole("option", { name: "Todos", exact: true }).click();
  116 |     await expect(page.getByText(/resultados? · página/)).toBeVisible({ timeout: 10000 });
  117 |   });
  118 | 
  119 |   test.describe("with enough roles for a second page", () => {
  120 |     // Both tests below create fixture roles under the same fixed names —
  121 |     // running them in parallel workers races two concurrent creates
  122 |     // against the same unique (empresa_id, name, guard_name) constraint.
  123 |     test.describe.configure({ mode: "serial" });
  124 | 
  125 |     let fixture: { ids: number[]; token: string };
  126 | 
> 127 |     test.beforeEach(async ({ request, page }) => {
      |          ^ Test timeout of 30000ms exceeded while running "beforeEach" hook.
  128 |       // RoleSeeder only creates 5 real roles per empresa — unlike
  129 |       // Categorías/Proveedores there's no ambient seed volume to page
  130 |       // through, so this creates its own and tears them down below.
  131 |       fixture = await createPaginationFixtureRoles(request, 7);
  132 |       await page.reload();
  133 |       await waitForRolesLoaded(page);
  134 |     });
  135 | 
  136 |     test.afterEach(async ({ request }) => {
  137 |       await deactivatePaginationFixtureRoles(request, fixture.token, fixture.ids);
  138 |     });
  139 | 
  140 |     test("changes page size and resets to page 1", async ({ page }) => {
  141 |       await page.getByLabel("Filas por página").click();
  142 |       await page.getByRole("option", { name: "10", exact: true }).click();
  143 |       await expect(page.getByText(/· página 1 de/)).toBeVisible({ timeout: 10000 });
  144 |       await expect(page.getByRole("row")).toHaveCount(11); // header + 10 data rows
  145 |     });
  146 | 
  147 |     test("navigates to the next page", async ({ page }) => {
  148 |       await page.getByLabel("Filas por página").click();
  149 |       await page.getByRole("option", { name: "10", exact: true }).click();
  150 |       await expect(page.getByText(/· página 1 de/)).toBeVisible({ timeout: 10000 });
  151 |       await page.getByLabel("Página siguiente").click();
  152 |       await expect(page.getByText(/· página 2 de/)).toBeVisible({ timeout: 10000 });
  153 |       const firstCell = page.getByRole("row").nth(1).getByRole("cell").first();
  154 |       await expect(firstCell).toHaveText("11");
  155 |     });
  156 |   });
  157 | 
  158 |   test("Ver opens a modal with the role's real details, not a page navigation", async ({ page }) => {
  159 |     await page.getByLabel("Buscar roles").fill("Administrador");
  160 |     await expect(page.getByRole("row")).toHaveCount(2, { timeout: 10000 });
  161 |     const row = page.getByRole("row").filter({ hasText: "Administrador" });
  162 |     await row.getByRole("button", { name: "Acciones" }).click();
  163 |     await page.getByRole("menuitem", { name: "Ver" }).click();
  164 | 
  165 |     const dialog = page.getByRole("dialog");
  166 |     await expect(dialog.getByText("Administrador", { exact: true })).toBeVisible();
  167 |     await expect(dialog.getByText("Activo")).toBeVisible();
  168 |     await expect(dialog.getByText(/^Permisos \(\d+\)$/)).toBeVisible();
  169 |     await expect(dialog.getByRole("button", { name: "Editar" })).toBeVisible();
  170 |     await expect(dialog.getByRole("button", { name: /^(Desactivar|Activar)$/ })).toBeVisible();
  171 |     await expect(page).toHaveURL(/\/roles(\?.*)?$/);
  172 |   });
  173 | 
  174 |   test("clicking a role's name also opens the Ver modal", async ({ page }) => {
  175 |     await page.getByLabel("Buscar roles").fill("Administrador");
  176 |     await expect(page.getByRole("row")).toHaveCount(2, { timeout: 10000 });
  177 |     await page.getByRole("row").filter({ hasText: "Administrador" }).getByRole("button").first().click();
  178 |     await expect(page.getByRole("dialog").getByText("Administrador", { exact: true })).toBeVisible();
  179 |   });
  180 | 
  181 |   test("Ver modal's Usuarios tab lists the role's real assigned users, read-only", async ({ page }) => {
  182 |     await page.getByLabel("Buscar roles").fill("Administrador");
  183 |     await expect(page.getByRole("row")).toHaveCount(2, { timeout: 10000 });
  184 |     await page.getByRole("row").filter({ hasText: "Administrador" }).getByRole("button").first().click();
  185 | 
  186 |     const dialog = page.getByRole("dialog");
  187 |     await dialog.getByRole("tab", { name: "Usuarios" }).click();
  188 |     // Administrador has real assigned users in the shared demo dataset — assert presence,
  189 |     // not an exact count, since that count is shared/mutable state outside this test's control.
  190 |     await expect(dialog.getByText(/@/).first()).toBeVisible({ timeout: 10000 });
  191 |     // Read-only: no action buttons anywhere in this tab.
  192 |     await expect(dialog.getByRole("button", { name: /Editar|Desactivar|Activar/ })).toHaveCount(0);
  193 |   });
  194 | 
  195 |   test("attempting to deactivate a role with assigned users surfaces the real 409 error, not a silent failure", async ({
  196 |     page,
  197 |   }) => {
  198 |     await page.getByLabel("Buscar roles").fill("Administrador");
  199 |     await expect(page.getByRole("row")).toHaveCount(2, { timeout: 10000 });
  200 |     const row = page.getByRole("row").filter({ hasText: "Administrador" });
  201 |     await row.getByRole("button").first().click();
  202 | 
  203 |     const dialog = page.getByRole("dialog");
  204 |     await dialog.getByRole("button", { name: "Desactivar" }).click();
  205 | 
  206 |     // The guard throws before any mutation, so this error renders on the page (shared with
  207 |     // the row-level toggle action), not inside the dialog itself.
  208 |     await expect(page.getByText(/Este rol tiene usuarios asignados/)).toBeVisible({ timeout: 10000 });
  209 |     // No partial mutation: the dialog's own state (a separate fetch) still reads Activo.
  210 |     await expect(dialog.getByText("Activo")).toBeVisible();
  211 | 
  212 |     // The open dialog marks the rest of the page inert, so the row behind it is excluded
  213 |     // from the accessibility tree until it closes — close it before checking the row too.
  214 |     await page.keyboard.press("Escape");
  215 |     await expect(dialog).not.toBeVisible();
  216 |     await expect(row.getByText("Activo")).toBeVisible();
  217 |   });
  218 | 
  219 |   test("is responsive: sidebar becomes a sheet on mobile viewport", async ({ page }) => {
  220 |     await page.setViewportSize({ width: 375, height: 812 });
  221 |     await expect(page.getByRole("button", { name: "Abrir menú" })).toBeVisible();
  222 |     await page.getByRole("button", { name: "Abrir menú" }).click();
  223 |     await expect(page.getByRole("link", { name: "Roles" })).toBeVisible();
  224 |   });
  225 | 
  226 |   test("Nuevo Rol opens a modal with real backend-driven fields and validates the required name", async ({
  227 |     page,
```