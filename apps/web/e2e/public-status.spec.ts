import { test, expect } from '@playwright/test';

test.describe('Phase 10: E2E Public Status Security', () => {

  test('should load public status page without authentication and strictly hide PHI', async ({ page }) => {
    // First, login to create a referral so we have a valid publicCode to test
    const ORIGIN_EMAIL = 'cho.wadgaon@sahay.demo';
    const PASSWORD = 'SahayDemoPass123!';
    
    await page.goto('/login');
    await page.fill('input[type="email"]', ORIGIN_EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/app/);

    // Let's create a quick referral
    await page.goto('/app/new/patient');
    await page.click('button:has-text("Register New")');
    await page.fill('input[id="displayName"]', 'Aarti Deshmukh');
    await page.fill('input[id="age"]', '30');
    await page.click('button[role="combobox"]');
    await page.click('div[role="option"]:has-text("Female")');
    await page.click('button:has-text("Register & Continue")');
    
    await page.click('button:has-text("ANC Danger Signs")');
    await page.click('button:has-text("Continue")');
    
    await page.fill('input[id="gestation_weeks"]', '30');
    await page.click('button[role="switch"]');
    await page.fill('input[id="bp"]', '120/80');
    await page.click('button:has-text("Continue")');
    
    await page.locator('button.bg-card').first().click();
    await page.click('button:has-text("Review & Confirm")');
    await page.click('button:has-text("Dispatch Handoff")');
    
    await expect(page).toHaveURL(/\/app/);
    await expect(page.locator('text=Aarti Deshmukh').first()).toBeVisible();
    
    // Get the handoff detail page to extract public code
    await page.locator('tr').filter({ hasText: 'Aarti Deshmukh' }).getByRole('link').first().click();
    await expect(page).toHaveURL(/\/app\/handoff\//);
    
    // The public code is available in the h1 tag
    const publicCode = await page.locator('h1').textContent();
    expect(publicCode).toBeTruthy();
    
    // Logout to test unauthenticated access
    await page.goto('/login'); // Assuming visiting login clears or we can clear context
    await page.context().clearCookies();
    
    // Visit the public status URL
    await page.goto(`/status/${publicCode?.trim()}`);
    
    // Wait for the status page to load
    await expect(page.locator('text=Referral Status')).toBeVisible();
    
    // Assert PHI is NOT visible
    await expect(page.locator('text=Aarti Deshmukh')).not.toBeVisible();
    await expect(page.locator('text=ANC Danger')).not.toBeVisible();
    
    // Assert non-sensitive info IS visible
    await expect(page.locator('text=Dispatched')).toBeVisible(); // or Pending/Arrived
  });

  test('should return 404 for invalid public code', async ({ page }) => {
    await page.goto('/status/INVALID_CODE_123');
    
    // We should see a Not Found or similar state
    await expect(page.getByText('Referral Status Unavailable', { exact: false })).toBeVisible();
  });
});
