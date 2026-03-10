import { expect, test } from '@playwright/test';

/**
 * Verifies shell-level navigation between remotes.
 */
test('redirects to customers and allows switching to accounts and back', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveURL(/\/customers$/);
  await expect(page.getByRole('heading', { name: 'Customers' })).toBeVisible();

  await page.getByRole('link', { name: 'Accounts' }).click();
  await expect(page).toHaveURL(/\/accounts$/);
  await expect(page.getByRole('heading', { name: 'Accounts' })).toBeVisible();

  await page.getByRole('link', { name: 'Customers' }).click();
  await expect(page).toHaveURL(/\/customers$/);
  await expect(page.getByRole('heading', { name: 'Customers' })).toBeVisible();
});
