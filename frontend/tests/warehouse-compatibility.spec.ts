import { test, expect } from "@playwright/test";
import { login } from "./helpers";

/**
 * Compatibilidad transitoria: el backend entiende bodegas, pero la aplicación
 * continúa operando visualmente como una sola ubicación (Principal implícita).
 */
test("inventory flows keep warehouse controls out of the UI", async ({ page }) => {
  await login(page);

  for (const route of ["/productos", "/stock", "/movimientos", "/reportes"]) {
    await page.goto(route);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole("link", { name: "Bodegas" })).toHaveCount(0);
    await expect(page.getByText("Bodega", { exact: true })).toHaveCount(0);
  }

  await page.goto("/movimientos");
  await page.getByRole("button", { name: "Nuevo Movimiento" }).click();
  await expect(page.getByLabel(/bodega/i)).toHaveCount(0);
  await expect(page.getByText("Bodega", { exact: true })).toHaveCount(0);
});
