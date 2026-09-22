import { test, expect } from '@playwright/test';

const ORIGIN_EMAIL = 'cho.wadgaon@sahay.demo';
const PASSWORD = 'SahayDemoPass123!';

test.describe('Phase 10: E2E Online Referral', () => {

  test('should complete the entire online referral flow', async ({ page }) => {
    test.setTimeout(45000); // UI flows take time

    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', ORIGIN_EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/app/);
    
    // Start New Referral
    await page.click('a:has-text("New Referral")');
    await expect(page).toHaveURL(/\/app\/new\/patient/);
    
    // Create Patient
    await page.click('button:has-text("Register New")');
    await page.fill('input[id="displayName"]', 'Kiran More');
    await page.fill('input[id="age"]', '28');
    await page.click('button[role="combobox"]'); // Sex dropdown
    await page.click('div[role="option"]:has-text("Female")');
    await page.click('button:has-text("Register & Continue")');
    
    // Triage / Protocol Selection
    await expect(page).toHaveURL(/\/app\/new\/protocol/);
    await page.click('button:has-text("ANC Danger Signs")'); 
    await page.click('button:has-text("Continue")');
    
    // Protocol Details
    await page.fill('input[id="gestation_weeks"]', '30');
    await page.click('button[role="switch"]'); // toggle first danger sign
    await page.fill('input[id="bp"]', '120/80');
    await page.click('button:has-text("Continue")');
    
    // Destination Selection
    await expect(page).toHaveURL(/\/app\/new\/destination/);
    // Click the first facility card
    await page.locator('button.bg-card').first().click();
    await page.click('button:has-text("Review & Confirm")');
    
    // Confirmation
    await expect(page).toHaveURL(/\/app\/new\/confirm/);
    await page.click('button:has-text("Dispatch Handoff")');
    
    // Should be redirected to app dashboard
    await expect(page).toHaveURL(/\/app/);
    
    // Verify it exists in the list
    await expect(page.locator('text=Kiran More').first()).toBeVisible();
    await expect(page.locator('text=Dispatched').first()).toBeVisible(); // Default state is sent
  });
});
