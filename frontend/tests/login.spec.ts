import { test, expect } from '@playwright/test';

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('shows login UI', async ({ page }) => {
    await expect(page.getByText('Your Collab X Account')).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByText(/stay logged in/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /continue/i })).toBeVisible();
  });

  test('allows user to type credentials', async ({ page }) => {
    await page.getByLabel(/email/i).fill('admin@gmail.com');
    await page.getByLabel(/password/i).fill('password123');

    await expect(page.getByLabel(/email/i)).toHaveValue('admin@gmail.com');
    await expect(page.getByLabel(/password/i)).toHaveValue('password123');
  });

  test('shows error with invalid credentials', async ({ page }) => {
    await page.getByLabel(/email/i).fill('wrong@gmail.com');
    await page.getByLabel(/password/i).fill('wrongpassword');

    await page.getByRole('button', { name: /continue/i }).click();

    await expect(
      page.getByText(/invalid|incorrect|error|failed/i),
    ).toBeVisible();
  });

  test('redirects after valid login', async ({ page }) => {
    await page.getByLabel(/email/i).fill('admin1@gmail.com');
    await page.getByLabel(/password/i).fill('role123');

    await page.getByRole('button', { name: /continue/i }).click();

    await expect(page).toHaveURL(/admin|dashboard|home|workspaces/);
  });
});
