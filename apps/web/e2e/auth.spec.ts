import { test, expect } from '@playwright/test';

const ORIGIN_EMAIL = 'cho.wadgaon@sahay.demo';
const DEST_EMAIL = 'desk.rajgurunagar@sahay.demo';
const SUP_EMAIL = 'supervisor.pune@sahay.demo';
const PASSWORD = 'SahayDemoPass123!';

test.describe('Phase 10: E2E Authentication and RBAC', () => {

  test('should login as Origin and access My Referrals', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', ORIGIN_EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');

    // Should redirect to Origin dashboard
    await expect(page).toHaveURL(/\/app/);
    await expect(page.locator('text=My Referrals').first()).toBeVisible();
    
    // Ensure cannot access supervisor dashboard
    await page.goto('/supervisor');
    // It should redirect or show a forbidden error. In our app, it redirects to /app or shows 403
    // But since it's Next.js and layout might fetch data, let's just assert we are redirected
    await expect(page).not.toHaveURL(/\/supervisor/);
  });

  test('should login as Destination and access Inbox', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', DEST_EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');

    // Should redirect to Destination dashboard
    await expect(page).toHaveURL(/\/destination/);
    await expect(page.locator('text=Incoming Referrals').first()).toBeVisible();
  });

  test('should login as Supervisor and access Dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', SUP_EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');

    // Should redirect to Supervisor dashboard
    await expect(page).toHaveURL(/\/supervisor/);
    await expect(page.locator('text=Supervisor Dashboard').first()).toBeVisible();
  });

  test('should reject invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'WrongPass123!');
    await page.click('button[type="submit"]');

    // Should show error and stay on login
    await expect(page.locator('.text-destructive').first()).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('should block unauthenticated access to protected routes', async ({ page }) => {
    // Try to directly visit a protected route
    await page.goto('/app/new/patient');
    
    // It should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});
