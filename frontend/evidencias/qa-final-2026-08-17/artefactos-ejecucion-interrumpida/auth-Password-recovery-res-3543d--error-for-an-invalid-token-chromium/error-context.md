# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Password recovery >> reset form surfaces the real backend error for an invalid token
- Location: tests\auth.spec.ts:117:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('[data-slot="alert"]')
Expected substring: "No pudimos restablecer tu contraseña"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('[data-slot="alert"]')

```

```yaml
- main:
  - text: FidelOS Restablecer contraseña Nueva contraseña
  - textbox "Nueva contraseña": longenough123
  - button "Mostrar contraseña"
  - text: Confirmar contraseña
  - textbox "Confirmar contraseña": longenough123
  - button "Restablecer contraseña" [disabled]
- alert
```

# Test source

```ts
  22  |     await page.goto("/login");
  23  |     await page.getByLabel("Correo electrónico").fill("no-existe-este-correo@example.com");
  24  |     await page.getByLabel("Contraseña", { exact: true }).fill("whatever123");
  25  |     await page.getByRole("button", { name: "Ingresar" }).click();
  26  |     await expect(page.locator('[data-slot="alert"]')).toContainText("Correo o contraseña incorrectos.");
  27  |   });
  28  | 
  29  |   test("shows/hides the password on toggle", async ({ page }) => {
  30  |     await page.goto("/login");
  31  |     const passwordInput = page.getByLabel("Contraseña", { exact: true });
  32  |     await passwordInput.fill("secret123");
  33  |     await expect(passwordInput).toHaveAttribute("type", "password");
  34  |     await page.getByRole("button", { name: "Mostrar contraseña" }).click();
  35  |     await expect(passwordInput).toHaveAttribute("type", "text");
  36  |   });
  37  | 
  38  |   test("logs in with valid credentials and reaches the dashboard", async ({ page }) => {
  39  |     await login(page);
  40  |     await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  41  |     await expect(page.getByText(DEMO_EMAIL)).toBeVisible();
  42  |   });
  43  | 
  44  |   test("persists the session across a full page reload", async ({ page }) => {
  45  |     await login(page);
  46  |     await page.reload();
  47  |     await expect(page).toHaveURL(/\/dashboard/);
  48  |     await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  49  |   });
  50  | 
  51  |   test("redirects an already-authenticated user away from /login", async ({ page }) => {
  52  |     await login(page);
  53  |     await page.goto("/login");
  54  |     await expect(page).toHaveURL(/\/dashboard/);
  55  |   });
  56  | 
  57  |   test("logs out and returns to login", async ({ page }) => {
  58  |     await login(page);
  59  |     await page.locator('[data-slot="dropdown-menu-trigger"]').click();
  60  |     await page.getByText("Cerrar sesión").click();
  61  |     await expect(page).toHaveURL(/\/login/);
  62  |   });
  63  | });
  64  | 
  65  | test.describe("Protected routes", () => {
  66  |   test("redirects an unauthenticated visitor from /dashboard to /login", async ({ page }) => {
  67  |     await page.goto("/dashboard");
  68  |     await expect(page).toHaveURL(/\/login/);
  69  |   });
  70  | 
  71  |   test("redirects an unauthenticated visitor from /usuarios to /login", async ({ page }) => {
  72  |     await page.goto("/usuarios");
  73  |     await expect(page).toHaveURL(/\/login/);
  74  |   });
  75  | });
  76  | 
  77  | test.describe("Password recovery", () => {
  78  |   test("shows the same generic message for a known email", async ({ page }) => {
  79  |     await page.goto("/olvide-password");
  80  |     await page.getByLabel("Correo electrónico").fill(DEMO_EMAIL);
  81  |     await page.getByRole("button", { name: "Enviar enlace de recuperación" }).click();
  82  |     await expect(page.locator('[data-slot="alert"]')).toContainText(
  83  |       "Si ese correo existe, enviamos un enlace"
  84  |     );
  85  |   });
  86  | 
  87  |   test("shows the same generic message for an unknown email (no enumeration)", async ({ page }) => {
  88  |     await page.goto("/olvide-password");
  89  |     await page.getByLabel("Correo electrónico").fill("no-existe@example.com");
  90  |     await page.getByRole("button", { name: "Enviar enlace de recuperación" }).click();
  91  |     await expect(page.locator('[data-slot="alert"]')).toContainText(
  92  |       "Si ese correo existe, enviamos un enlace"
  93  |     );
  94  |   });
  95  | 
  96  |   test("reset page without token/email shows an invalid-link message", async ({ page }) => {
  97  |     await page.goto("/restablecer-password");
  98  |     await expect(page.locator('[data-slot="alert"]')).toContainText("El enlace de restablecimiento no es válido");
  99  |   });
  100 | 
  101 |   test("reset form rejects a too-short password client-side", async ({ page }) => {
  102 |     await page.goto("/restablecer-password?token=fake-token&email=test@example.com");
  103 |     await page.getByLabel("Nueva contraseña").fill("short");
  104 |     await page.getByLabel("Confirmar contraseña").fill("short");
  105 |     await page.getByRole("button", { name: "Restablecer contraseña" }).click();
  106 |     await expect(page.getByText("La contraseña debe tener al menos 8 caracteres.")).toBeVisible();
  107 |   });
  108 | 
  109 |   test("reset form rejects a mismatched confirmation client-side", async ({ page }) => {
  110 |     await page.goto("/restablecer-password?token=fake-token&email=test@example.com");
  111 |     await page.getByLabel("Nueva contraseña").fill("longenough123");
  112 |     await page.getByLabel("Confirmar contraseña").fill("different123");
  113 |     await page.getByRole("button", { name: "Restablecer contraseña" }).click();
  114 |     await expect(page.getByText("Las contraseñas no coinciden.")).toBeVisible();
  115 |   });
  116 | 
  117 |   test("reset form surfaces the real backend error for an invalid token", async ({ page }) => {
  118 |     await page.goto("/restablecer-password?token=not-a-real-token&email=test@example.com");
  119 |     await page.getByLabel("Nueva contraseña").fill("longenough123");
  120 |     await page.getByLabel("Confirmar contraseña").fill("longenough123");
  121 |     await page.getByRole("button", { name: "Restablecer contraseña" }).click();
> 122 |     await expect(page.locator('[data-slot="alert"]')).toContainText("No pudimos restablecer tu contraseña");
      |                                                       ^ Error: expect(locator).toContainText(expected) failed
  123 |   });
  124 | });
  125 | 
```