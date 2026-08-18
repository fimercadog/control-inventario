import { type Page, expect } from "@playwright/test";

export const DEMO_EMAIL = "test@example.com";
export const DEMO_PASSWORD = "password";

export async function login(page: Page, email = DEMO_EMAIL, password = DEMO_PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

/**
 * Header's account trigger shows name/role passively; the email only renders
 * inside the dropdown's label once opened (Header.tsx DropdownMenuContent).
 */
export async function openUserMenu(page: Page) {
  await page.getByRole("button", { name: /Administrador$/ }).click();
}
