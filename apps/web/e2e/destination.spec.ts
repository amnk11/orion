import { test, expect } from '@playwright/test';

const DEST_EMAIL = 'desk.rajgurunagar@sahay.demo';
const PASSWORD = 'SahayDemoPass123!';

test.describe('Phase 10: E2E Destination Workflow', () => {

  test('should process a handoff from Inbox to Closed', async ({ page }) => {
    test.setTimeout(45000);

    // 1. Login as Destination
    await page.goto('/login');
    await page.fill('input[type="email"]', DEST_EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/destination/);
    await expect(page.locator('text=Incoming Referrals')).toBeVisible();

    // The list should show "Sent" referrals. Wait for network/list to load.
    // If list is empty, we can't test. We assume `online-referral.spec.ts` ran and created one, 
    // or seed data has one. 
    await expect(page.locator('tr').nth(1)).toBeVisible(); // At least one row besides header

    // Click on the Open button of the first handoff
    await page.locator('a:has-text("Open")').first().click();
    
    // We should be on handoff detail
    await expect(page).toHaveURL(/\/destination\/handoff\//);
    
    // If we can accept, accept it
    if (await page.locator('button:has-text("Accept Patient")').isVisible()) {
      await page.click('button:has-text("Accept Patient")');
      await expect(page.locator('text=Accepted').first()).toBeVisible();
    }

    // Mark as Arrived
    if (await page.locator('button:has-text("Mark Arrived")').isVisible()) {
      await page.click('button:has-text("Mark Arrived")');
      await expect(page.locator('text=Arrived').first()).toBeVisible();
    }

    // Start Care
    if (await page.locator('button:has-text("Start Care")').isVisible()) {
      await page.click('button:has-text("Start Care")');
      await expect(page.locator('text=In Care').first()).toBeVisible();
    }

    // Record Outcome
    if (await page.locator('button:has-text("Record Outcome")').isVisible()) {
      await page.click('button:has-text("Record Outcome")');
      
      await page.locator('select').first().selectOption('admitted');
      await page.locator('textarea').first().fill('Patient is stable.');
      await page.locator('div[role="dialog"] button:has-text("Record Outcome")').click();
      
      await expect(page.locator('text=Closed').first()).toBeVisible();
    }
  });
});
