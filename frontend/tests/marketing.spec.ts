import { test, expect } from "@playwright/test";

// Regression guard for a real bug: headings that inherit their color from
// <main> (rather than setting their own) were rendering near-white on the
// marketing page's always-light background whenever the visitor's OS/browser
// preferred dark mode, because `<main>` carried the literal Tailwind class
// `text-slate-900`, which a `.dark .marketing .text-slate-900` rule in
// globals.css forces to `#f8fafc`. Fixed by giving `<main>` (and every other
// element that used to carry a bare text-slate-900/950/800/700 class) an
// equivalent `text-[#hex]` value instead, which that selector can't match.
test.describe("marketing page stays legible when the OS prefers dark mode", () => {
  test.use({ colorScheme: "dark" });

  test("headings render dark text on the light marketing background", async ({ page }) => {
    await page.goto("/");

    const heading = page.getByRole("heading", { name: /Más control para tu operación/i });
    await expect(heading).toBeVisible();
    // The hero H1 sets its own near-black shade; other headings inherit
    // <main>'s color. Both must stay dark instead of washing out to the
    // broken #f8fafc the bug produced.
    await expect(heading).toHaveCSS("color", "rgb(2, 6, 23)");

    await page.locator("#preguntas").scrollIntoViewIfNeeded();
    const faqHeading = page.getByRole("heading", { name: "Lo esencial, claro." });
    await expect(faqHeading).toHaveCSS("color", "rgb(15, 23, 42)");
  });
});

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
