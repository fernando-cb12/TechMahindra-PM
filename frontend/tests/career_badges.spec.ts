import { test, expect } from '@playwright/test';

test('team leader can open a badge details modal', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel(/email/i).fill('lead1@gmail.com');
  await page.getByLabel(/password/i).fill('role123');
  await page.getByRole('button', { name: /continue/i }).click();

  await expect(page).toHaveURL(/dashboard|workspaces|home|career/, {
    timeout: 15000,
  });

  await page.getByRole('button', { name: /career/i }).click();

  await expect(page.getByRole('main').getByText('Badge Gallery')).toBeVisible({
    timeout: 10000,
  });

  const primeroBadge = page
    .getByText('Primero', { exact: true })
    .locator('xpath=ancestor::*[contains(@class, "MuiPaper-root")][1]');

  await primeroBadge.dispatchEvent('click');

  const dialog = page.getByRole('dialog');

  await expect(dialog).toBeVisible({ timeout: 10000 });

  await expect(dialog.getByText(/primero/i)).toBeVisible();
  await expect(dialog.getByText(/first solve/i).first()).toBeVisible();
  await expect(dialog.getByText(/earned date/i)).toBeVisible();

  await dialog
    .getByRole('button', { name: /close achievement details/i })
    .click();

  await expect(dialog).not.toBeVisible({ timeout: 10000 });
});
