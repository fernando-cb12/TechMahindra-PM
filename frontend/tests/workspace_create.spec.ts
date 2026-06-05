import { test, expect } from '@playwright/test';

test('team leader can create a workspace from scratch', async ({ page }) => {
  const workspaceName = `Workspace Playwright ${Date.now()}`;

  // Login as Team Leader
  await page.goto('/login');

  await page.getByLabel(/email/i).fill('lead1@gmail.com');
  await page.getByLabel(/password/i).fill('role123');

  await page.getByRole('button', { name: /continue/i }).click();

  await expect(page).toHaveURL(/dashboard|workspaces|home/);

  // Go to workspaces page
  await page.goto('/workspaces');

  // Open create workspace flow
  await page.getByRole('button', { name: /create workspace/i }).click();

  // Select create from scratch
  await page.getByRole('button', { name: /create from scratch/i }).click();

  const dialog = page.getByRole('dialog');

  // Fill form
  await dialog.locator('input').nth(0).fill(workspaceName);
  await dialog
    .locator('textarea')
    .first()
    .fill('Workspace created by Playwright test.');

  // Seleccionar miembro
  await dialog.getByRole('combobox').click();
  await page.getByRole('option', { name: 'Diego Ramos' }).click();

  // Cerrar dropdown
  await page.keyboard.press('Escape');


  await dialog
    .getByRole('textbox', {
      name: /due date/i,
    })
    .fill('2026-12-31');

   await dialog
     .getByRole('textbox', {
       name: /development budget/i,
     })
     .fill('50000');

  // Submit
  await dialog.getByRole('button', { name: /create workspace/i }).click();

  // Verify workspace was created
  await expect(
    page.getByText(workspaceName, { exact: true }).first(),
  ).toBeVisible();
});
