import { test, expect } from '@playwright/test';

test('team leader can switch between light and dark mode', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel(/email/i).fill('lead1@gmail.com');
  await page.getByLabel(/password/i).fill('role123');
  await page.getByRole('button', { name: /continue/i }).click();

  await expect(page).toHaveURL(/dashboard|workspaces|home|career/, {
    timeout: 15000,
  });

  await page.getByRole('button', { name: /settings/i }).click();

  await expect(
    page.getByRole('main').getByText('Settings', { exact: true }),
  ).toBeVisible({ timeout: 10000 });

  const main = page.getByRole('main').nth(1);

  const beforeBackground = await main.evaluate(
    (element) => window.getComputedStyle(element).backgroundColor,
  );

  await page.getByRole('button', { name: /^Apply$/ }).click();

  await expect
    .poll(async () => {
      return await main.evaluate(
        (element) => window.getComputedStyle(element).backgroundColor,
      );
    })
    .not.toBe(beforeBackground);

  const afterBackground = await main.evaluate(
    (element) => window.getComputedStyle(element).backgroundColor,
  );

  // Click light mode/applied button again if available
  const applyButtons = page.getByRole('button', { name: /apply/i });

  if (
    await applyButtons
      .first()
      .isVisible()
      .catch(() => false)
  ) {
    await applyButtons.first().click();

    await expect
      .poll(async () => {
        return await main.evaluate(
          (element) => window.getComputedStyle(element).backgroundColor,
        );
      })
      .not.toBe(afterBackground);
  }
});
