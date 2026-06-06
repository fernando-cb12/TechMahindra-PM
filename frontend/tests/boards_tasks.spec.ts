import { test, expect, Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/login');

  await page.getByLabel(/email/i).fill('lead1@gmail.com');
  await page.getByLabel(/password/i).fill('role123');

  await page.getByRole('button', { name: /continue/i }).click();

  await expect(page).toHaveURL(/dashboard|workspaces|home/);
}

async function openWorkspace(page: Page) {
  await page.goto('/workspaces');

  const workspaceButton = page.locator('main').getByText(/customer wayfinding/i).first();

  await expect(workspaceButton).toBeVisible({ timeout: 10000 });
  await workspaceButton.click();

  await expect(
    page.getByRole('button', { name: /back to workspaces/i }),
  ).toBeVisible({ timeout: 10000 });
}

async function getBoardNames(page: Page) {
  const boardButtons = page.locator('aside').getByRole('button').filter({
    hasText: /^(Planning|Delivery|Review|Task Board(?: \d+)?)$/,
  });
  const names = await boardButtons.allTextContents();

  return names.map((name) => name.trim()).filter(Boolean);
}

async function createItemInBoard(page: Page, boardName: string) {
  const itemName = `Item Playwright ${boardName} ${Date.now()}`;

  const boardButton = page.locator('aside').getByRole('button', {
    name: new RegExp(`^${boardName}$`, 'i'),
  });

  await expect(boardButton).toBeVisible({ timeout: 10000 });
  await boardButton.click();

  await expect(
    page.getByRole('heading', {
      name: new RegExp(`^${boardName}$`, 'i'),
    }),
  ).toBeVisible({ timeout: 10000 });

  await page.getByRole('button', { name: /add task/i }).click();

  await page.keyboard.type(itemName);
  await page.keyboard.press('Enter');

  await expect(page.getByText(itemName)).toBeVisible({
    timeout: 10000,
  });

  return itemName;
}

async function deleteItem(page: Page, itemName: string) {
  const boardArea = page.locator('main');
  const item = boardArea.getByText(itemName).first();

  await expect(item).toBeVisible({ timeout: 10000 });
  const itemElement = await item.elementHandle();

  await item.click({ button: 'right' });

  await page.getByText(/delete item/i).click();

  const confirmButton = page.getByRole('button', {
    name: /delete|confirm|yes/i,
  });

  if (await confirmButton.isVisible().catch(() => false)) {
    await confirmButton.click();
  }

  await expect
    .poll(async () => {
      return itemElement
        ? await itemElement.evaluate((node) => node.isConnected).catch(() => false)
        : false;
    })
    .toBe(false);
}

test('team leader can create and delete one item in each board', async ({
  page,
}) => {
  await login(page);

  await openWorkspace(page);

  const boards = await getBoardNames(page);

  console.log('Boards found:', boards);

  expect(boards.length).toBeGreaterThan(0);

  for (const board of boards) {
    const itemName = await createItemInBoard(page, board);
    await deleteItem(page, itemName);

    await openWorkspace(page);
  }
});
