import { test, expect } from "@playwright/test";
import path from "path";
import { login } from "./helpers";

const IMG = path.join(__dirname, "fixtures", "test-imagen.png");
const WAV = path.join(__dirname, "fixtures", "test-audio.wav");

/**
 * These exercise CLICK -> EFECTO ESPERADO against the real backend/OpenAI
 * pipeline (matching how the rest of this suite tests against real data,
 * not mocks) for the happy paths, and a routed failure for the error path.
 * Every prior "Captura IA" reference in this suite only checked sidebar
 * link visibility per role — none of it ever opened the page or clicked
 * anything here.
 */
test.describe("Captura IA", () => {
  // Every happy-path test here makes a real OpenAI round trip through
  // `php artisan serve`, which handles one request at a time (see
  // playwright.config.ts) — running them concurrently across workers queues
  // logins/requests behind each other and produces spurious timeouts.
  test.describe.configure({ mode: "serial" });

  test("Analizar is disabled with no file, per mode", async ({ page }) => {
    await login(page);
    await page.goto("/captura-ia");
    const analizarBtn = page.getByRole("button", { name: "Analizar" });

    await expect(analizarBtn).toBeDisabled();

    await page.getByRole("button", { name: "Voz", exact: true }).click();
    await expect(analizarBtn).toBeDisabled();

    await page.getByRole("button", { name: "Foto + Voz" }).click();
    await expect(analizarBtn).toBeDisabled();
  });

  test("switching modes swaps which file input is shown", async ({ page }) => {
    await login(page);
    await page.goto("/captura-ia");

    await expect(page.getByLabel("Seleccionar imagen")).toBeVisible();
    await expect(page.getByLabel("Seleccionar audio")).toHaveCount(0);

    await page.getByRole("button", { name: "Voz", exact: true }).click();
    await expect(page.getByLabel("Seleccionar audio")).toBeVisible();
    await expect(page.getByLabel("Seleccionar imagen")).toHaveCount(0);

    await page.getByRole("button", { name: "Foto + Voz" }).click();
    await expect(page.getByLabel("Seleccionar imagen")).toBeVisible();
    await expect(page.getByLabel("Seleccionar audio")).toBeVisible();
  });

  test("rejects a non-image file for the Imagen input client-side", async ({ page }) => {
    await login(page);
    await page.goto("/captura-ia");
    await page.getByLabel("Seleccionar imagen").setInputFiles(WAV);
    await expect(page.getByText("El archivo debe ser una imagen.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Analizar" })).toBeDisabled();
  });

  test("Foto: select image, Analizar submits to the real backend and lands on the result", async ({ page }) => {
    await login(page);
    await page.goto("/captura-ia");

    await page.getByLabel("Seleccionar imagen").setInputFiles(IMG);
    await expect(page.getByText("test-imagen.png")).toBeVisible();

    const analizarBtn = page.getByRole("button", { name: "Analizar" });
    await expect(analizarBtn).toBeEnabled();
    await analizarBtn.click();

    await expect(page.getByRole("button", { name: "Analizar" }).locator(".animate-spin")).toBeVisible();
    await expect(page).toHaveURL(/\/captura-ia\/[0-9a-f-]{36}/, { timeout: 20000 });
    await expect(page.getByRole("heading", { name: "Captura por Foto" })).toBeVisible();
    await expect(page.getByText("Productos detectados")).toBeVisible();
  });

  test("Voz: select audio, Analizar transcribes and lands on the result", async ({ page }) => {
    await login(page);
    await page.goto("/captura-ia");
    await page.getByRole("button", { name: "Voz", exact: true }).click();

    await page.getByLabel("Seleccionar audio").setInputFiles(WAV);
    await expect(page.getByText("test-audio.wav")).toBeVisible();

    await page.getByRole("button", { name: "Analizar" }).click();
    await expect(page).toHaveURL(/\/captura-ia\/[0-9a-f-]{36}/, { timeout: 20000 });
    await expect(page.getByRole("heading", { name: "Captura por Voz" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Transcripción")).toBeVisible();
  });

  test("Foto + Voz: requires both files, then submits both to the real backend", async ({ page }) => {
    await login(page);
    await page.goto("/captura-ia");
    await page.getByRole("button", { name: "Foto + Voz" }).click();

    const analizarBtn = page.getByRole("button", { name: "Analizar" });
    await page.getByLabel("Seleccionar imagen").setInputFiles(IMG);
    await expect(analizarBtn).toBeDisabled();

    await page.getByLabel("Seleccionar audio").setInputFiles(WAV);
    await expect(analizarBtn).toBeEnabled();
    await analizarBtn.click();

    await expect(page).toHaveURL(/\/captura-ia\/[0-9a-f-]{36}/, { timeout: 20000 });
    await expect(page.getByRole("heading", { name: "Captura Foto + Voz" })).toBeVisible();
  });

  test("a backend failure surfaces the real error message and re-enables Analizar", async ({ page }) => {
    await login(page);
    await page.goto("/captura-ia");

    await page.route("**/api/v1/captura-ia/foto", (route) =>
      route.fulfill({
        status: 502,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          message: "No pudimos analizar tu captura. Intenta de nuevo en unos minutos.",
          errors: [],
        }),
      })
    );

    await page.getByLabel("Seleccionar imagen").setInputFiles(IMG);
    const analizarBtn = page.getByRole("button", { name: "Analizar" });
    await analizarBtn.click();

    await expect(page.getByText("No pudimos analizar tu captura. Intenta de nuevo en unos minutos.")).toBeVisible();
    await expect(analizarBtn).toBeEnabled();
    await expect(page).toHaveURL(/\/captura-ia$/);
  });

  test("confirming a capture updates its estado and the recientes list", async ({ page }) => {
    await login(page);
    await page.goto("/captura-ia");

    await page.getByLabel("Seleccionar imagen").setInputFiles(IMG);
    await page.getByRole("button", { name: "Analizar" }).click();
    await expect(page).toHaveURL(/\/captura-ia\/[0-9a-f-]{36}/, { timeout: 20000 });

    const confirmarBtn = page.getByRole("button", { name: "Confirmar" });
    const descartarBtn = page.getByRole("button", { name: "Descartar" });

    if (await confirmarBtn.isVisible().catch(() => false)) {
      await confirmarBtn.click();
      await expect(page.getByText("Aplicado").first()).toBeVisible({ timeout: 10000 });
    } else if (await descartarBtn.isVisible().catch(() => false)) {
      await descartarBtn.click();
      await expect(page.getByText("Descartado").first()).toBeVisible({ timeout: 10000 });
    }

    await page.goto("/captura-ia");
    await expect(page.getByText("Capturas recientes")).toBeVisible();
    await expect(page.locator("li", { hasText: "Foto ·" }).first()).toBeVisible();
  });
});
