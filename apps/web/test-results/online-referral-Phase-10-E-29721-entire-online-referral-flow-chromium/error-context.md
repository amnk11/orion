# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: online-referral.spec.ts >> Phase 10: E2E Online Referral >> should complete the entire online referral flow
- Location: e2e\online-referral.spec.ts:8:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Dispatched').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('text=Dispatched').first() with timeout 5000ms
  - waiting for locator('text=Dispatched').first()

```

```yaml
- complementary:
  - link "Sahay Logo Sahay":
    - /url: /app
    - img "Sahay Logo"
    - text: Sahay
  - navigation:
    - text: Origin Desk
    - link "My Referrals":
      - /url: /app
    - link "New Referral":
      - /url: /app/new/patient
  - text: Sunita Kale cho.wadgaon@sahay.demo
  - button "Sign out"
- main:
  - button "Back to Dashboard"
  - heading "Patient Information" [level=1]
  - paragraph: Select an existing patient or register a new one.
  - button "Search Existing"
  - button "Register New"
  - text: Search patients
  - textbox "Search patients":
    - /placeholder: Search by name, phone, or ID...
  - button "E2E Online Patient 469ccc29 28y • female"
  - button "Kavita Shinde 25c9a216 24y • female"
  - button "Meena Pawar 46446e38 26y • female"
  - button "Test Patient Phase 3 a26f68d6 30y • female"
  - button "Auth Test Patient 19d71561 25y • female"
  - paragraph: Showing 1 to 5 of 165 patients
  - button "Previous page" [disabled]
  - button "Next page"
  - navigation "Progress":
    - list:
      - listitem: 1 Patient Patient information
      - listitem: 2 Protocol Clinical protocol
      - listitem: 3 Clinical Clinical assessment
      - listitem: 4 Destination Referral facility
      - listitem: 5 Confirm Review & submit
    - paragraph: You are creating a new referral. Follow the steps to complete the process.
- region "Notifications alt+T"
- alert: Sahay
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | const ORIGIN_EMAIL = 'cho.wadgaon@sahay.demo';
  4  | const PASSWORD = 'SahayDemoPass123!';
  5  | 
  6  | test.describe('Phase 10: E2E Online Referral', () => {
  7  | 
  8  |   test('should complete the entire online referral flow', async ({ page }) => {
  9  |     test.setTimeout(45000); // UI flows take time
  10 | 
  11 |     // Login
  12 |     await page.goto('/login');
  13 |     await page.fill('input[type="email"]', ORIGIN_EMAIL);
  14 |     await page.fill('input[type="password"]', PASSWORD);
  15 |     await page.click('button[type="submit"]');
  16 | 
  17 |     await expect(page).toHaveURL(/\/app/);
  18 |     
  19 |     // Start New Referral
  20 |     await page.click('a:has-text("New Referral")');
  21 |     await expect(page).toHaveURL(/\/app\/new\/patient/);
  22 |     
  23 |     // Create Patient
  24 |     await page.click('button:has-text("Register New")');
  25 |     await page.fill('input[id="displayName"]', 'E2E Online Patient');
  26 |     await page.fill('input[id="age"]', '28');
  27 |     await page.click('button[role="combobox"]'); // Sex dropdown
  28 |     await page.click('div[role="option"]:has-text("Female")');
  29 |     await page.click('button:has-text("Register & Continue")');
  30 |     
  31 |     // Triage / Protocol Selection
  32 |     await expect(page).toHaveURL(/\/app\/new\/protocol/);
  33 |     await page.click('button:has-text("ANC Danger Signs")'); 
  34 |     await page.click('button:has-text("Continue")');
  35 |     
  36 |     // Protocol Details
  37 |     await page.fill('input[id="gestation_weeks"]', '30');
  38 |     await page.click('button[role="switch"]'); // toggle first danger sign
  39 |     await page.fill('input[id="bp"]', '120/80');
  40 |     await page.click('button:has-text("Continue")');
  41 |     
  42 |     // Destination Selection
  43 |     await expect(page).toHaveURL(/\/app\/new\/destination/);
  44 |     // Click the first facility card
  45 |     await page.locator('button.bg-card').first().click();
  46 |     await page.click('button:has-text("Review & Confirm")');
  47 |     
  48 |     // Confirmation
  49 |     await expect(page).toHaveURL(/\/app\/new\/confirm/);
  50 |     await page.click('button:has-text("Dispatch Handoff")');
  51 |     
  52 |     // Should be redirected to app dashboard
  53 |     await expect(page).toHaveURL(/\/app/);
  54 |     
  55 |     // Verify it exists in the list
  56 |     await expect(page.locator('text=E2E Online Patient').first()).toBeVisible();
> 57 |     await expect(page.locator('text=Dispatched').first()).toBeVisible(); // Default state is sent
     |                                                           ^ Error: expect(locator).toBeVisible() failed
  58 |   });
  59 | });
  60 | 
```