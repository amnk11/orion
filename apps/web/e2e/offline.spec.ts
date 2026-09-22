import { test, expect } from '@playwright/test';

// Use the seeded CHO credentials from the implementation plan / backend tests
const ORIGIN_EMAIL = 'cho.wadgaon@sahay.demo';
const DEST_EMAIL = 'desk.rajgurunagar@sahay.demo';
const PASSWORD = 'SahayDemoPass123!';

test.describe('Phase 7 Offline Sync Scenarios', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to login and authenticate as Origin
    await page.goto('/login');
    await page.fill('input[type="email"]', ORIGIN_EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/app', { timeout: 30000 });
  });

  test('E2E 1 - Offline banner appears when offline', async ({ page, context }) => {
    await page.goto('/app/new/patient');
    await context.setOffline(true);
    
    // The banner should appear
    const banner = page.locator('text=You\'re offline. New referrals will be saved and synced');
    await expect(banner).toBeVisible();
    
    await context.setOffline(false);
  });

  test('E2E 2 to 5 - Offline patient/referral creation and sync', async ({ page, context }) => {
    test.setTimeout(60000); // This is a long flow
    
    // Cache the reference data first by visiting the forms online
    await page.goto('/app/new/patient');
    await page.waitForLoadState('networkidle');
    
    // Go offline
    await context.setOffline(true);
    
    // Ensure offline state has propagated before proceeding
    const banner = page.locator('text=You\'re offline. New referrals will be saved and synced');
    await expect(banner).toBeVisible();
    
    // Create Patient
    await page.click('button:has-text("Register New")');
    await page.fill('input[id="displayName"]', 'E2E Offline Patient');
    await page.fill('input[id="age"]', '30');
    // Select sex
    await page.click('button[role="combobox"]');
    await page.click('div[role="option"]:has-text("Female")');
    await page.click('button:has-text("Register & Continue")');
    
    // Now on protocol selection (or triage)
    await expect(page).toHaveURL(/.*\/app\/new\/protocol/);
    await page.click('button:has-text("ANC Danger Signs")'); // Select protocol
    await page.click('button:has-text("Continue")');
    
    // Triage form
    await page.fill('input[id="gestation_weeks"]', '30');
    await page.click('button[role="switch"]'); // Toggle a danger sign switch (first one)
    await page.fill('input[id="bp"]', '120/80');
    await page.click('button:has-text("Continue")');
    
    // Destination Selection
    await expect(page).toHaveURL(/.*\/app\/new\/destination/);
    
    // We should see cached destinations. Select the first one.
    await page.locator('button.bg-card').first().click();
    await page.click('button:has-text("Review & Confirm")'); 
    
    // Confirm
    await expect(page).toHaveURL(/.*\/app\/new\/confirm/);
    await page.click('button:has-text("Dispatch Handoff")');
    
    // Should be redirected to app dashboard
    await expect(page).toHaveURL('/app');
    
    // Verify pending/offline state
    await expect(page.locator('text=E2E Offline Patient')).toBeVisible();
    await expect(page.locator('text=Saved Offline')).toBeVisible();

    // Refresh browser while offline
    await page.reload();
    await expect(page.locator('text=E2E Offline Patient')).toBeVisible();
    await expect(page.locator('text=Saved Offline')).toBeVisible();

    // Restore network (Sync engine should trigger)
    await context.setOffline(false);
    
    // It should eventually say Synced
    await expect(page.locator('text=Synced')).toBeVisible({ timeout: 15000 });
    
    // Refresh and ensure it's still there (deduplicated)
    await page.reload();
    await expect(page.locator('text=E2E Offline Patient')).toBeVisible();
    await expect(page.locator('text=Synced')).not.toBeVisible(); // After refresh, it might not show offline tags since it's just server data
    await expect(page.locator('text=Saved Offline')).not.toBeVisible();
    
    // Ensure only ONE instance exists
    const rowCount = await page.locator('tr:has-text("E2E Offline Patient")').count();
    expect(rowCount).toBe(1);
  });

});
