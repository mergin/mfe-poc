import { expect, test } from '@playwright/test';

/**
 * Verifies customer list rendering and detail navigation.
 */
test('renders customer list, opens detail, and navigates back', async ({ page }) => {
  await page.goto('/customers');

  await expect(page).toHaveURL(/\/customers$/);
  await expect(page.getByRole('heading', { name: 'Customers' })).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(5);
  await expect(page.locator('tbody tr').first()).toContainText('Alice Martínez');

  await page.locator('tbody tr').first().getByRole('link', { name: /View/ }).click();

  await expect(page).toHaveURL(/\/customers\/c-001$/);
  await expect(page.getByRole('heading', { name: /Alice Martínez/ })).toBeVisible();
  await expect(page.locator('.badge.badge--active')).toBeVisible();

  await page.locator('.back-link').click();
  await expect(page).toHaveURL(/\/customers$/);
  await expect(page.locator('table')).toBeVisible();
});
