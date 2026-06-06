import { test, expect, Page } from '@playwright/test';

async function loginAsTeamLeader(page: Page) {
  await page.goto('/login');

  await page.getByLabel(/email/i).fill('lead1@gmail.com');
  await page.getByLabel(/password/i).fill('role123');
  await page.getByRole('button', { name: /continue/i }).click();

  await expect(page).toHaveURL(/dashboard|workspaces|home/, {
    timeout: 15000,
  });
}

async function clearFilters(page: Page) {
  await page.getByRole('button', { name: /clear filters/i }).click();
  await expect(page.getByText(/all status/i).first()).toBeVisible();
  await expect(page.getByText(/all members/i).first()).toBeVisible();
  await expect(page.getByText(/all progress/i).first()).toBeVisible();
}

async function selectOptionFromFilter(
  page: Page,
  filterIndex: number,
  optionName: string,
) {
  const filter = page.getByRole('combobox').nth(filterIndex);

  await filter.click();

  await page
    .getByRole('option', {
      name: optionName,
      exact: true,
    })
    .click();

  await page.keyboard.press('Escape');
}

test('team leader can use all workspace filters', async ({ page }) => {
  await loginAsTeamLeader(page);

  await page.getByRole('button', { name: /workspaces/i }).click();

  await expect(
    page.getByRole('main').getByText(/manage and track workspaces/i),
  ).toBeVisible({ timeout: 10000 });

  await page.getByRole('button', { name: /filter/i }).click();

  const statusOptions = ['Planning', 'Active', 'In Progress', 'Completed'];

  for (const status of statusOptions) {
    await selectOptionFromFilter(page, 0, status);
    await expect(page.getByText(status).first()).toBeVisible();
    await clearFilters(page);
  }

  const membersFilter = page.getByRole('combobox').nth(1);

  await membersFilter.click();

  const memberOptions = await page.getByRole('option').allTextContents();

  await page.keyboard.press('Escape');

  for (const member of memberOptions) {
    const cleanMember = member.trim();

    if (!cleanMember || /all members/i.test(cleanMember)) {
      continue;
    }

    await selectOptionFromFilter(page, 1, cleanMember);
    await expect(page.getByText(cleanMember).first()).toBeVisible();
    await clearFilters(page);
  }

  const progressOptions = [
    'Real > Estimated',
    'Real < Estimated',
    'Real = Estimated',
  ];

  for (const progress of progressOptions) {
    await selectOptionFromFilter(page, 2, progress);
    await expect(page.getByText(progress).first()).toBeVisible();
    await clearFilters(page);
  }
});
