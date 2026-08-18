import { test, expect } from "@playwright/test";
import { login, openUserMenu, DEMO_EMAIL } from "./helpers";

test.describe("Login", () => {
  test("shows client-side validation for an empty submit", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Ingresar" }).click();
    await expect(page.getByText("El correo es obligatorio.")).toBeVisible();
    await expect(page.getByText("La contraseña es obligatoria.")).toBeVisible();
  });

  test("rejects an invalid password with the real backend error message", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill(DEMO_EMAIL);
    await page.getByLabel("Contraseña", { exact: true }).fill("wrong-password");
    await page.getByRole("button", { name: "Ingresar" }).click();
    await expect(page.locator('[data-slot="alert"]')).toContainText("Correo o contraseña incorrectos.");
    await expect(page).toHaveURL(/\/login/);
  });

  test("rejects a nonexistent user with the same message (no enumeration)", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill("no-existe-este-correo@example.com");
    await page.getByLabel("Contraseña", { exact: true }).fill("whatever123");
    await page.getByRole("button", { name: "Ingresar" }).click();
    await expect(page.locator('[data-slot="alert"]')).toContainText("Correo o contraseña incorrectos.");
  });

  test("shows/hides the password on toggle", async ({ page }) => {
    await page.goto("/login");
    const passwordInput = page.getByLabel("Contraseña", { exact: true });
    await passwordInput.fill("secret123");
    await expect(passwordInput).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Mostrar contraseña" }).click();
    await expect(passwordInput).toHaveAttribute("type", "text");
  });

  test("logs in with valid credentials and reaches the dashboard", async ({ page }) => {
    await login(page);
    // Dashboard's real <h1> is the personalized "Hola, {name}" greeting, not literally
    // "Dashboard" — that word only ever appears as the header breadcrumb (a <span>, not
    // a heading). Checking for a real level-1 heading confirms the page actually rendered.
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await openUserMenu(page);
    await expect(page.getByText(DEMO_EMAIL)).toBeVisible();
  });

  test("persists the session across a full page reload", async ({ page }) => {
    await login(page);
    await page.reload();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("redirects an already-authenticated user away from /login", async ({ page }) => {
    await login(page);
    await page.goto("/login");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("logs out and returns to login", async ({ page }) => {
    await login(page);
    await page.locator('[data-slot="dropdown-menu-trigger"]').click();
    await page.getByText("Cerrar sesión").click();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Protected routes", () => {
  test("redirects an unauthenticated visitor from /dashboard to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects an unauthenticated visitor from /usuarios to /login", async ({ page }) => {
    await page.goto("/usuarios");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Password recovery", () => {
  test("shows the same generic message for a known email", async ({ page }) => {
    await page.goto("/olvide-password");
    await page.getByLabel("Correo electrónico").fill(DEMO_EMAIL);
    await page.getByRole("button", { name: "Enviar enlace de recuperación" }).click();
    await expect(page.locator('[data-slot="alert"]')).toContainText(
      "Si ese correo existe, enviamos un enlace"
    );
  });

  test("shows the same generic message for an unknown email (no enumeration)", async ({ page }) => {
    await page.goto("/olvide-password");
    await page.getByLabel("Correo electrónico").fill("no-existe@example.com");
    await page.getByRole("button", { name: "Enviar enlace de recuperación" }).click();
    await expect(page.locator('[data-slot="alert"]')).toContainText(
      "Si ese correo existe, enviamos un enlace"
    );
  });

  test("reset page without token/email shows an invalid-link message", async ({ page }) => {
    await page.goto("/restablecer-password");
    await expect(page.locator('[data-slot="alert"]')).toContainText("El enlace de restablecimiento no es válido");
  });

  test("reset form rejects a too-short password client-side", async ({ page }) => {
    await page.goto("/restablecer-password?token=fake-token&email=test@example.com");
    await page.getByLabel("Nueva contraseña").fill("short");
    await page.getByLabel("Confirmar contraseña").fill("short");
    await page.getByRole("button", { name: "Restablecer contraseña" }).click();
    await expect(page.getByText("La contraseña debe tener al menos 8 caracteres.")).toBeVisible();
  });

  test("reset form rejects a mismatched confirmation client-side", async ({ page }) => {
    await page.goto("/restablecer-password?token=fake-token&email=test@example.com");
    await page.getByLabel("Nueva contraseña").fill("longenough123");
    await page.getByLabel("Confirmar contraseña").fill("different123");
    await page.getByRole("button", { name: "Restablecer contraseña" }).click();
    await expect(page.getByText("Las contraseñas no coinciden.")).toBeVisible();
  });

  test("reset form surfaces the real backend error for an invalid token", async ({ page }) => {
    await page.goto("/restablecer-password?token=not-a-real-token&email=test@example.com");
    await page.getByLabel("Nueva contraseña").fill("longenough123");
    await page.getByLabel("Confirmar contraseña").fill("longenough123");
    await page.getByRole("button", { name: "Restablecer contraseña" }).click();
    await expect(page.locator('[data-slot="alert"]')).toContainText("No pudimos restablecer tu contraseña");
  });
});
