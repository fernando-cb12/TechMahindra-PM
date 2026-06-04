import { test, expect, Page } from '@playwright/test';

async function ensureCalendarView(page: Page) {
  const calendarTab = page.getByRole('tab', { name: /calendar/i });

  if (await calendarTab.isVisible().catch(() => false)) {
    await calendarTab.click();
    return;
  }

  await page.getByRole('button', { name: /add new view/i }).click();
  await page.getByText('Calendar', { exact: true }).click();

  await expect(calendarTab).toBeVisible({ timeout: 10000 });
  await calendarTab.click();
}

test('team leader can create an event from calendar view', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel(/email/i).fill('lead1@gmail.com');
  await page.getByLabel(/password/i).fill('role123');
  await page.getByRole('button', { name: /continue/i }).click();

  await expect(page).toHaveURL(/dashboard|workspaces|home|admin/, {
    timeout: 15000,
  });

  await page.getByRole('button', { name: /customer wayfinding/i }).click();
  await page.getByRole('button', { name: 'Delivery' }).click();

  await ensureCalendarView(page);

  const scheduledCounter = page.locator('main').getByText(/scheduled/i);
  const beforeText = await scheduledCounter.textContent();

  await page
    .locator('main')
    .getByText('7', { exact: true })
    .first()
    .click({ button: 'right' });

  await page.getByRole('menuitem', { name: /new item in tasks/i }).click();

  const taskDialog = page.getByRole('dialog');
  const titleInput = taskDialog.getByRole('textbox').first();

  await expect(titleInput).toHaveValue(/new task/i, {
    timeout: 10000,
  });

  await taskDialog
    .getByRole('textbox', { name: /write an update/i })
    .fill('Calendar event created by Playwright.');

  await taskDialog.getByRole('button', { name: /update/i }).click();

  await expect(
    taskDialog.getByText(/calendar event created by playwright/i),
  ).toBeVisible({ timeout: 10000 });

  await taskDialog.getByRole('button').first().click();

  await expect(scheduledCounter).not.toHaveText(beforeText ?? '', {
    timeout: 10000,
  });
});
