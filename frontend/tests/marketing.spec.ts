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

test("hero CTAs, product visuals and every demo tab render real product content", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("button", { name: /Solicitar una demo/i }).first()).toHaveAttribute("href", "#demo");
  await expect(page.getByRole("button", { name: /Ver cómo funciona/i })).toHaveAttribute("href", "#producto");

  await expect(page.getByAltText(/Panel de FidelOS/i)).toBeVisible();
  await expect(page.getByAltText(/entradas, ajustes y salidas/i)).toBeVisible();
  await expect(page.getByAltText(/Red de contactos/i)).toBeVisible();

  const tabs: Array<[string, string | RegExp]> = [
    ["Inventario", "Inventario en contexto"],
    ["CRM", "CRM que acompaña el seguimiento"],
    ["Reportes", "Información para revisar"],
    ["Seguridad", "Acceso administrado"],
  ];
  for (const [label, heading] of tabs) {
    await page.getByRole("tab", { name: label }).click();
    await expect(page.getByRole("tabpanel")).toContainText(heading);
  }
});

test("comparison, process and audience sections communicate the real product", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Deja de administrar tu negocio entre Excel, WhatsApp y notas sueltas.")).toBeVisible();
  await expect(page.getByText("Un catálogo único: productos, categorías, marcas y unidades.")).toBeVisible();

  await expect(page.getByRole("heading", { name: "De cero a operando, en cuatro pasos." })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Construido para equipos que necesitan controlar/i })).toBeVisible();
});

test("marketing page renders correctly on a tablet viewport", async ({ page }) => {
  await page.setViewportSize({ width: 834, height: 1194 });
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /Más control para tu operación/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Iniciar sesión" }).first()).toBeVisible();
});
