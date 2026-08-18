# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: captura-ia.spec.ts >> Captura IA >> confirming a capture updates its estado and the recientes list
- Location: tests\captura-ia.spec.ts:134:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Capturas recientes')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Capturas recientes')

```

```yaml
- main:
  - img "Cargando"
- alert
```

# Test source

```ts
  54  |     await login(page);
  55  |     await page.goto("/captura-ia");
  56  |     await page.getByLabel("Seleccionar imagen").setInputFiles(WAV);
  57  |     await expect(page.getByText("El archivo debe ser una imagen.")).toBeVisible();
  58  |     await expect(page.getByRole("button", { name: "Analizar" })).toBeDisabled();
  59  |   });
  60  | 
  61  |   test("Foto: select image, Analizar submits to the real backend and lands on the result", async ({ page }) => {
  62  |     await login(page);
  63  |     await page.goto("/captura-ia");
  64  | 
  65  |     await page.getByLabel("Seleccionar imagen").setInputFiles(IMG);
  66  |     await expect(page.getByText("test-imagen.png")).toBeVisible();
  67  | 
  68  |     const analizarBtn = page.getByRole("button", { name: "Analizar" });
  69  |     await expect(analizarBtn).toBeEnabled();
  70  |     await analizarBtn.click();
  71  | 
  72  |     await expect(page.getByRole("button", { name: "Analizar" }).locator(".animate-spin")).toBeVisible();
  73  |     await expect(page).toHaveURL(/\/captura-ia\/[0-9a-f-]{36}/, { timeout: 20000 });
  74  |     await expect(page.getByRole("heading", { name: "Captura por Foto" })).toBeVisible();
  75  |     await expect(page.getByText("Productos detectados")).toBeVisible();
  76  |   });
  77  | 
  78  |   test("Voz: select audio, Analizar transcribes and lands on the result", async ({ page }) => {
  79  |     await login(page);
  80  |     await page.goto("/captura-ia");
  81  |     await page.getByRole("button", { name: "Voz", exact: true }).click();
  82  | 
  83  |     await page.getByLabel("Seleccionar audio").setInputFiles(WAV);
  84  |     await expect(page.getByText("test-audio.wav")).toBeVisible();
  85  | 
  86  |     await page.getByRole("button", { name: "Analizar" }).click();
  87  |     await expect(page).toHaveURL(/\/captura-ia\/[0-9a-f-]{36}/, { timeout: 20000 });
  88  |     await expect(page.getByRole("heading", { name: "Captura por Voz" })).toBeVisible({ timeout: 10000 });
  89  |     await expect(page.getByText("Transcripción")).toBeVisible();
  90  |   });
  91  | 
  92  |   test("Foto + Voz: requires both files, then submits both to the real backend", async ({ page }) => {
  93  |     await login(page);
  94  |     await page.goto("/captura-ia");
  95  |     await page.getByRole("button", { name: "Foto + Voz" }).click();
  96  | 
  97  |     const analizarBtn = page.getByRole("button", { name: "Analizar" });
  98  |     await page.getByLabel("Seleccionar imagen").setInputFiles(IMG);
  99  |     await expect(analizarBtn).toBeDisabled();
  100 | 
  101 |     await page.getByLabel("Seleccionar audio").setInputFiles(WAV);
  102 |     await expect(analizarBtn).toBeEnabled();
  103 |     await analizarBtn.click();
  104 | 
  105 |     await expect(page).toHaveURL(/\/captura-ia\/[0-9a-f-]{36}/, { timeout: 20000 });
  106 |     await expect(page.getByRole("heading", { name: "Captura Foto + Voz" })).toBeVisible();
  107 |   });
  108 | 
  109 |   test("a backend failure surfaces the real error message and re-enables Analizar", async ({ page }) => {
  110 |     await login(page);
  111 |     await page.goto("/captura-ia");
  112 | 
  113 |     await page.route("**/api/v1/captura-ia/foto", (route) =>
  114 |       route.fulfill({
  115 |         status: 502,
  116 |         contentType: "application/json",
  117 |         body: JSON.stringify({
  118 |           success: false,
  119 |           message: "No pudimos analizar tu captura. Intenta de nuevo en unos minutos.",
  120 |           errors: [],
  121 |         }),
  122 |       })
  123 |     );
  124 | 
  125 |     await page.getByLabel("Seleccionar imagen").setInputFiles(IMG);
  126 |     const analizarBtn = page.getByRole("button", { name: "Analizar" });
  127 |     await analizarBtn.click();
  128 | 
  129 |     await expect(page.getByText("No pudimos analizar tu captura. Intenta de nuevo en unos minutos.")).toBeVisible();
  130 |     await expect(analizarBtn).toBeEnabled();
  131 |     await expect(page).toHaveURL(/\/captura-ia$/);
  132 |   });
  133 | 
  134 |   test("confirming a capture updates its estado and the recientes list", async ({ page }) => {
  135 |     await login(page);
  136 |     await page.goto("/captura-ia");
  137 | 
  138 |     await page.getByLabel("Seleccionar imagen").setInputFiles(IMG);
  139 |     await page.getByRole("button", { name: "Analizar" }).click();
  140 |     await expect(page).toHaveURL(/\/captura-ia\/[0-9a-f-]{36}/, { timeout: 20000 });
  141 | 
  142 |     const confirmarBtn = page.getByRole("button", { name: "Confirmar" });
  143 |     const descartarBtn = page.getByRole("button", { name: "Descartar" });
  144 | 
  145 |     if (await confirmarBtn.isVisible().catch(() => false)) {
  146 |       await confirmarBtn.click();
  147 |       await expect(page.getByText("Aplicado").first()).toBeVisible({ timeout: 10000 });
  148 |     } else if (await descartarBtn.isVisible().catch(() => false)) {
  149 |       await descartarBtn.click();
  150 |       await expect(page.getByText("Descartado").first()).toBeVisible({ timeout: 10000 });
  151 |     }
  152 | 
  153 |     await page.goto("/captura-ia");
> 154 |     await expect(page.getByText("Capturas recientes")).toBeVisible();
      |                                                        ^ Error: expect(locator).toBeVisible() failed
  155 |     await expect(page.locator("li", { hasText: "Foto ·" }).first()).toBeVisible();
  156 |   });
  157 | });
  158 | 
```