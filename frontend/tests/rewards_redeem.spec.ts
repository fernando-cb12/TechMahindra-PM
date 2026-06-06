import { test, expect } from '@playwright/test';

test('team leader can redeem a reward', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel(/email/i).fill('lead1@gmail.com');
  await page.getByLabel(/password/i).fill('role123');
  await page.getByRole('button', { name: /continue/i }).click();

  await expect(page).toHaveURL(/dashboard|workspaces|home|career/, {
    timeout: 15000,
  });

  await page.getByRole('button', { name: /career/i }).click();

  await expect(page.getByRole('button', { name: /rewards/i })).toBeVisible({
    timeout: 10000,
  });

  await page.getByRole('button', { name: /rewards/i }).click();

  await expect(page.getByText(/your balance/i).first()).toBeVisible({
    timeout: 10000,
  });

  await page.getByRole('button', { name: /half-day off/i }).click();

  const redeemDialog = page.getByRole('dialog');

  await expect(redeemDialog.getByText(/half-day off/i)).toBeVisible();

  await redeemDialog.getByRole('button', { name: /redeem reward/i }).click();

  await expect(
    page.getByRole('dialog').getByText(/reward redeemed/i),
  ).toBeVisible({ timeout: 10000 });

  await expect(
    page.getByRole('dialog').getByText(/remaining balance/i),
  ).toBeVisible();

  await page.getByRole('button', { name: /done/i }).click();

  await expect(page.getByRole('dialog')).not.toBeVisible({
    timeout: 10000,
  });
});
