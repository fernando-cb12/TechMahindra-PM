import { test, expect, Page } from '@playwright/test';

async function createItemInBoard(page: Page, boardName: string) {
  const itemName = `Item Playwright ${boardName} ${Date.now()}`;

  // Click board
  await page.getByRole('button', { name: boardName }).click();

  await expect(page.getByRole('heading', { name: boardName })).toBeVisible();

    await page.getByRole('button', { name: /add task/i }).click();

    await page.keyboard.type(itemName);
    await page.keyboard.press('Enter');

  // Verify created
  await expect(page.getByText(itemName)).toBeVisible({
    timeout: 10000,
  });

  return itemName;
}

async function deleteItem(page: Page, itemName: string) {
  const boardArea = page.locator('main');
  const item = boardArea.getByText(itemName).first();

  await item.click({ button: 'right' });

  await page.getByText(/delete item/i).click();

  const confirmButton = page.getByRole('button', {
    name: /delete|confirm|yes/i,
  });

  if (await confirmButton.isVisible().catch(() => false)) {
    await confirmButton.click();
  }

  await expect(boardArea.getByText(itemName)).not.toBeVisible({
  timeout: 10000,
    });
}

test('team leader can create and delete one item in each board', async ({
  page,
}) => {
  // Login
  await page.goto('/login');

  await page.getByLabel(/email/i).fill('lead1@gmail.com');
  await page.getByLabel(/password/i).fill('role123');

  await page.getByRole('button', { name: /continue/i }).click();

  await expect(page).toHaveURL(/dashboard|workspaces|home/);

  // Go to workspace boards
  await page.goto('/workspaces');

  // Open workspace
  await page.getByRole('button', { name: /customer wayfinding/i }).click();

  const boards = ['Delivery', 'Review', 'Prueba'];

  for (const board of boards) {
    const itemName = await createItemInBoard(page, board);
    await deleteItem(page, itemName);
  }
});
