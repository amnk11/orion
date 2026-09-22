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
    
    // Check for major cards (State Counts, Ageing, Outcomes)
    await expect(page.locator('text=Supervisor Dashboard')).toBeVisible();
    await expect(page.locator('text=Pending Referrals')).toBeVisible();
    await expect(page.locator('text=Referral Ageing')).toBeVisible();
    await expect(page.locator('text=Capability Freshness')).toBeVisible();
    
    // Check that we have a table or metric blocks rendering
    await expect(page.locator('.bg-card.border').first()).toBeVisible();
    const cards = await page.locator('.bg-card.border').count();
    expect(cards).toBeGreaterThanOrEqual(4);
  });
});
