import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test("theme selector changes immediately and persists after reload", async ({ page }) => {
  await login(page);

  const menu = page.locator('[data-slot="dropdown-menu-trigger"]');
  await menu.click();
  await expect(page.getByText("Apariencia", { exact: true })).toBeVisible();
  await expect(page.getByText("Claro", { exact: true })).toBeVisible();
  await expect(page.getByText("Oscuro", { exact: true })).toBeVisible();
  await expect(page.getByText("Sistema", { exact: true })).toBeVisible();

  await page.getByText("Claro", { exact: true }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await expect(page.locator("html")).toHaveCSS("--primary", "#3949ab");
  await page.reload();
  await expect(page.locator("html")).not.toHaveClass(/dark/);

  await page.locator('[data-slot="dropdown-menu-trigger"]').click();
  await page.getByText("Oscuro", { exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.locator('[data-slot="dropdown-menu-trigger"]').click();
  await page.getByText("Sistema", { exact: true }).click();
});
