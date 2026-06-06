import { test, expect } from '@playwright/test';

test('team leader can create the three board views', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel(/email/i).fill('lead1@gmail.com');
  await page.getByLabel(/password/i).fill('role123');
  await page.getByRole('button', { name: /continue/i }).click();

  await expect(page).toHaveURL(/dashboard|workspaces|home/);

  await page.goto('/workspaces');

  await page.locator('main').getByText(/customer wayfinding/i).first().click();

  await page.locator('main').getByText('Delivery', { exact: true }).first().click();

  await expect(page.getByRole('heading', { name: 'Delivery' })).toBeVisible();

  const views = ['Insights', 'Calendar', 'Kanban'];

  for (const view of views) {
    await page.getByTitle(/add new view/i).click();

    await page.getByText(view, { exact: true }).click();

    await expect(
      page.getByRole('tab', { name: new RegExp(view, 'i') }),
    ).toBeVisible({ timeout: 10000 });
  }
});
