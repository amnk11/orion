import { test, expect } from '@playwright/test';

const SUP_EMAIL = 'supervisor.pune@sahay.demo';
const PASSWORD = 'SahayDemoPass123!';

test.describe('Phase 10: E2E Supervisor Dashboard', () => {

  test('should load supervisor dashboard and verify metrics are rendered', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', SUP_EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/supervisor/);
    
    // Check the intervention-first summary exposed by the aggregate API.
    await expect(page.getByRole('heading', { name: 'Operational intervention' })).toBeVisible();
    await expect(page.getByText('Pending referrals', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Waiting time for pending referrals' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Capability freshness' })).toBeVisible();
    
    // Check that we have a table or metric blocks rendering
    await expect(page.locator('[aria-label^="Overdue follow-ups:"]').first()).toBeVisible();
    const cards = await page.locator('[aria-label]').count();
    expect(cards).toBeGreaterThanOrEqual(4);
  });
});
