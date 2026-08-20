import { test, expect } from "@playwright/test";

test("public marketing page loads and primary navigation works", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /Más control para tu operación/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Iniciar sesión" }).first()).toHaveAttribute("href", "/login");

  await page.getByRole("link", { name: "Inventario" }).first().click();
  await expect(page.locator("#inventario")).toBeInViewport();

  await page.getByRole("tab", { name: "CRM" }).click();
  await expect(page.getByRole("tabpanel")).toContainText("CRM que acompaña el seguimiento");
});

test("marketing interactions are usable on mobile and do not submit the demo form", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await page.getByRole("button", { name: "Abrir menú" }).click();
  await expect(page.getByRole("navigation", { name: "Navegación móvil" })).toBeVisible();

  await page.getByRole("button", { name: /¿Qué es FidelOS/i }).click();
  await expect(page.getByText("Es una plataforma que reúne control de inventario y CRM")).toBeVisible();

  await page.locator("#demo").scrollIntoViewIfNeeded();
  await page.getByLabel("Nombre").fill("Nombre de prueba");
  await page.getByLabel("Empresa").fill("Empresa de prueba");
  await page.getByLabel("Email").fill("prueba@example.com");
  await page.getByRole("button", { name: "Preparar solicitud" }).click();
  await expect(page.getByRole("status")).toContainText("Formulario validado localmente");
});
