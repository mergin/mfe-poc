import { expect, test } from '@playwright/test';

/**
 * Verifies account list rendering and detail navigation.
 */
test('renders account list, opens detail, and navigates back', async ({ page }) => {
  await page.goto('/accounts');

  await expect(page).toHaveURL(/\/accounts$/);
  await expect(page.getByRole('heading', { name: 'Accounts' })).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(6);
  await expect(page.locator('tbody tr').first()).toContainText('ES12-0049-0001');

  await page.locator('tbody tr').first().getByRole('link', { name: /View/ }).click();

  await expect(page).toHaveURL(/\/accounts\/a-001$/);
  await expect(page.getByRole('heading', { name: /Account number ES12-0049-0001/ })).toBeVisible();
  await expect(page.locator('.badge.badge--checking')).toBeVisible();

  await page.locator('.back-link').click();
  await expect(page).toHaveURL(/\/accounts$/);
  await expect(page.locator('table')).toBeVisible();
});
