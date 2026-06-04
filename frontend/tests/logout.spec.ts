import { test, expect } from '@playwright/test';

test('team leader can logout successfully', async ({ page }) => {
  // Login
  await page.goto('/login');

  await page.getByLabel(/email/i).fill('lead1@gmail.com');
  await page.getByLabel(/password/i).fill('role123');

  await page.getByRole('button', { name: /continue/i }).click();

  // Verify login succeeded
  await expect(page).toHaveURL(/dashboard|workspaces|home|career/, {
    timeout: 15000,
  });

  // Logout
  await page.getByRole('button', { name: /log out/i }).click();

  // Verify user returned to login page
  await expect(page).toHaveURL(/login/, {
    timeout: 10000,
  });

  // Verify login form is visible
  await expect(page.getByRole('button', { name: /continue/i })).toBeVisible();

  // Try to access a protected route
  await page.goto('/workspaces');

  // User should not have access anymore
  await expect(page).toHaveURL(/login/, {
    timeout: 10000,
  });
});
