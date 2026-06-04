import { test, expect } from '@playwright/test';

test('admin can create and delete a user', async ({ page }) => {

    page.on('response', async (response) => {
      if (response.url().includes('/api')) {
        console.log(response.status(), response.url());
      }
    });

  const testEmail = `playwright_${Date.now()}@gmail.com`;
  const testName = 'Playwright Test User';

  // Login as admin
  await page.goto('/admin');

  await page.getByLabel(/email/i).fill('admin1@gmail.com');
  await page.getByLabel(/password/i).fill('role123');

  await page.getByRole('button', { name: /continue/i }).click();

  // Go to user management
  await expect(page).toHaveURL(/user-management|admin|dashboard/);

  await page.goto('/admin');

  // Open create user modal
  await page.getByRole('button', { name: /create user/i }).click();

  // Fill form
    const dialog = page.getByRole('dialog');

    await dialog.locator('input').nth(0).fill(testName);
    await dialog.locator('input').nth(1).fill(testEmail);
    await dialog.locator('input').nth(2).fill('role1234');

  // Select role
  await page.getByLabel(/role/i).click();
  await page.getByRole('option', { name: /developer/i }).click();

  // Create user
await dialog.getByRole('button', { name: /create user/i }).click();

await expect(dialog).not.toBeVisible({ timeout: 10000 });

await page.reload();

await expect(page.locator('table')).toContainText(testEmail, {
  timeout: 15000,
});

const userRow = page.locator('tr').filter({
  hasText: testEmail,
});

await expect(userRow).toBeVisible();

  // Delete user
  await userRow.getByRole('button').last().click();

  // Confirm delete
  await page.getByRole('button', { name: /delete|confirm|yes/i }).click();

  // Verify user was deleted
  await expect(userRow).not.toBeVisible();
});
