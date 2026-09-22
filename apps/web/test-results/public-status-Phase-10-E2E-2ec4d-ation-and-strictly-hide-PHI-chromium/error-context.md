# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: public-status.spec.ts >> Phase 10: E2E Public Status Security >> should load public status page without authentication and strictly hide PHI
- Location: e2e\public-status.spec.ts:5:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('tr:has-text("PHI Test Patient")').locator('a')

```

# Page snapshot

```yaml
- generic [active] [ref=f1e1]:
  - generic [ref=f1e2]:
    - complementary [ref=f1e3]:
      - link "Sahay Logo Sahay" [ref=f1e5] [cursor=pointer]:
        - /url: /app
        - img "Sahay Logo" [ref=f1e6]
        - generic [ref=f1e7]: Sahay
      - navigation [ref=f1e8]:
        - generic [ref=f1e9]: Origin Desk
        - link "My Referrals" [ref=f1e10] [cursor=pointer]:
          - /url: /app
        - link "New Referral" [ref=f1e14] [cursor=pointer]:
          - /url: /app/new/patient
      - generic [ref=f1e18]:
        - generic [ref=f1e19]: Sunita Kale
        - generic [ref=f1e20]: cho.wadgaon@sahay.demo
        - button "Sign out" [ref=f1e21]
    - main [ref=f1e25]:
      - generic [ref=f1e28]:
        - generic [ref=f1e30]:
          - generic [ref=f1e31]:
            - button "Back to Dashboard" [ref=f1e32]
            - heading "Patient Information" [level=1] [ref=f1e33]
            - paragraph [ref=f1e34]: Select an existing patient or register a new one.
          - generic [ref=f1e35]:
            - button "Search Existing" [ref=f1e36]
            - button "Register New" [ref=f1e37]
          - generic [ref=f1e39]:
            - generic [ref=f1e40]:
              - generic [ref=f1e44]: Search patients
              - textbox "Search patients" [ref=f1e45]:
                - /placeholder: Search by name, phone, or ID...
            - generic [ref=f1e46]:
              - button "PHI Test Patient c6ad6d4b 30y • female" [ref=f1e47]:
                - generic [ref=f1e48]:
                  - generic [ref=f1e49]: PHI Test Patient
                  - generic [ref=f1e50]: c6ad6d4b
                - generic [ref=f1e52]:
                  - generic [ref=f1e53]: 30y
                  - generic [ref=f1e54]: •
                  - generic [ref=f1e55]: female
              - button "E2E Online Patient 469ccc29 28y • female" [ref=f1e56]:
                - generic [ref=f1e57]:
                  - generic [ref=f1e58]: E2E Online Patient
                  - generic [ref=f1e59]: 469ccc29
                - generic [ref=f1e61]:
                  - generic [ref=f1e62]: 28y
                  - generic [ref=f1e63]: •
                  - generic [ref=f1e64]: female
              - button "Kavita Shinde 25c9a216 24y • female" [ref=f1e65]:
                - generic [ref=f1e66]:
                  - generic [ref=f1e67]: Kavita Shinde
                  - generic [ref=f1e68]: 25c9a216
                - generic [ref=f1e70]:
                  - generic [ref=f1e71]: 24y
                  - generic [ref=f1e72]: •
                  - generic [ref=f1e73]: female
              - button "Meena Pawar 46446e38 26y • female" [ref=f1e74]:
                - generic [ref=f1e75]:
                  - generic [ref=f1e76]: Meena Pawar
                  - generic [ref=f1e77]: "46446e38"
                - generic [ref=f1e79]:
                  - generic [ref=f1e80]: 26y
                  - generic [ref=f1e81]: •
                  - generic [ref=f1e82]: female
              - button "Test Patient Phase 3 a26f68d6 30y • female" [ref=f1e83]:
                - generic [ref=f1e84]:
                  - generic [ref=f1e85]: Test Patient Phase 3
                  - generic [ref=f1e86]: a26f68d6
                - generic [ref=f1e88]:
                  - generic [ref=f1e89]: 30y
                  - generic [ref=f1e90]: •
                  - generic [ref=f1e91]: female
              - generic [ref=f1e92]:
                - paragraph [ref=f1e93]: Showing 1 to 5 of 166 patients
                - generic [ref=f1e94]:
                  - button "Previous page" [disabled]
                  - button "Next page" [ref=f1e95]
        - navigation "Progress" [ref=f1e98]:
          - list [ref=f1e99]:
            - listitem [ref=f1e101]:
              - generic [ref=f1e102]:
                - generic [ref=f1e103]: "1"
                - generic [ref=f1e104]:
                  - generic [ref=f1e105]: Patient
                  - generic [ref=f1e106]: Patient information
            - listitem [ref=f1e107]:
              - generic [ref=f1e108]:
                - generic [ref=f1e109]: "2"
                - generic [ref=f1e110]:
                  - generic [ref=f1e111]: Protocol
                  - generic [ref=f1e112]: Clinical protocol
            - listitem [ref=f1e113]:
              - generic [ref=f1e114]:
                - generic [ref=f1e115]: "3"
                - generic [ref=f1e116]:
                  - generic [ref=f1e117]: Clinical
                  - generic [ref=f1e118]: Clinical assessment
            - listitem [ref=f1e119]:
              - generic [ref=f1e120]:
                - generic [ref=f1e121]: "4"
                - generic [ref=f1e122]:
                  - generic [ref=f1e123]: Destination
                  - generic [ref=f1e124]: Referral facility
            - listitem [ref=f1e125]:
              - generic [ref=f1e126]:
                - generic [ref=f1e127]: "5"
                - generic [ref=f1e128]:
                  - generic [ref=f1e129]: Confirm
                  - generic [ref=f1e130]: Review & submit
          - paragraph [ref=f1e134]: You are creating a new referral. Follow the steps to complete the process.
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=f1e140] [cursor=pointer]
  - alert [ref=f1e144]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Phase 10: E2E Public Status Security', () => {
  4  | 
  5  |   test('should load public status page without authentication and strictly hide PHI', async ({ page }) => {
  6  |     // First, login to create a referral so we have a valid publicCode to test
  7  |     const ORIGIN_EMAIL = 'cho.wadgaon@sahay.demo';
  8  |     const PASSWORD = 'SahayDemoPass123!';
  9  |     
  10 |     await page.goto('/login');
  11 |     await page.fill('input[type="email"]', ORIGIN_EMAIL);
  12 |     await page.fill('input[type="password"]', PASSWORD);
  13 |     await page.click('button[type="submit"]');
  14 |     
  15 |     await expect(page).toHaveURL(/\/app/);
  16 | 
  17 |     // Let's create a quick referral
  18 |     await page.goto('/app/new/patient');
  19 |     await page.click('button:has-text("Register New")');
  20 |     await page.fill('input[id="displayName"]', 'PHI Test Patient');
  21 |     await page.fill('input[id="age"]', '30');
  22 |     await page.click('button[role="combobox"]');
  23 |     await page.click('div[role="option"]:has-text("Female")');
  24 |     await page.click('button:has-text("Register & Continue")');
  25 |     
  26 |     await page.click('button:has-text("ANC Danger Signs")');
  27 |     await page.click('button:has-text("Continue")');
  28 |     
  29 |     await page.fill('input[id="gestation_weeks"]', '30');
  30 |     await page.click('button[role="switch"]');
  31 |     await page.fill('input[id="bp"]', '120/80');
  32 |     await page.click('button:has-text("Continue")');
  33 |     
  34 |     await page.locator('button.bg-card').first().click();
  35 |     await page.click('button:has-text("Review & Confirm")');
  36 |     await page.click('button:has-text("Dispatch Handoff")');
  37 |     
  38 |     await expect(page).toHaveURL(/\/app/);
  39 |     await expect(page.locator('text=PHI Test Patient').first()).toBeVisible();
  40 |     
  41 |     // Get the handoff detail page to extract public code
> 42 |     await page.click('tr:has-text("PHI Test Patient") >> a');
     |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  43 |     await expect(page).toHaveURL(/\/app\/handoff\//);
  44 |     
  45 |     // The public code is available in the h1 tag
  46 |     const publicCode = await page.locator('h1').textContent();
  47 |     expect(publicCode).toBeTruthy();
  48 |     
  49 |     // Logout to test unauthenticated access
  50 |     await page.goto('/login'); // Assuming visiting login clears or we can clear context
  51 |     await page.context().clearCookies();
  52 |     
  53 |     // Visit the public status URL
  54 |     await page.goto(`/status/${publicCode?.trim()}`);
  55 |     
  56 |     // Wait for the status page to load
  57 |     await expect(page.locator('text=Referral Status')).toBeVisible();
  58 |     
  59 |     // Assert PHI is NOT visible
  60 |     await expect(page.locator('text=PHI Test Patient')).not.toBeVisible();
  61 |     await expect(page.locator('text=ANC Danger')).not.toBeVisible();
  62 |     
  63 |     // Assert non-sensitive info IS visible
  64 |     await expect(page.locator('text=Dispatched')).toBeVisible(); // or Pending/Arrived
  65 |   });
  66 | 
  67 |   test('should return 404 for invalid public code', async ({ page }) => {
  68 |     await page.goto('/status/INVALID_CODE_123');
  69 |     
  70 |     // We should see a Not Found or similar state
  71 |     await expect(page.getByText('Referral Status Unavailable', { exact: false })).toBeVisible();
  72 |   });
  73 | });
  74 | 
```