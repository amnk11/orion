# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: offline.spec.ts >> Phase 7 Offline Sync Scenarios >> E2E 2 to 5 - Offline patient/referral creation and sync
- Location: e2e\offline.spec.ts:30:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: page.fill: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('input[name="displayName"]')

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
        - generic [ref=f1e20]: cho.wadgaon@orion.local
        - button "Sign out" [ref=f1e21]
    - main [ref=f1e25]:
      - generic [ref=f1e26]: You're offline. New referrals will be saved and synced when you're back online.
      - generic [ref=f1e32]:
        - generic [ref=f1e34]:
          - generic [ref=f1e35]:
            - button "Back to Dashboard" [ref=f1e36]
            - heading "Patient Information" [level=1] [ref=f1e37]
            - paragraph [ref=f1e38]: Select an existing patient or register a new one.
          - generic [ref=f1e39]:
            - button "Search Existing" [ref=f1e40]
            - button "Register New" [ref=f1e41]
          - generic [ref=f1e43]:
            - generic [ref=f1e44]:
              - generic [ref=f1e48]: Search patients
              - textbox "Search patients" [ref=f1e49]:
                - /placeholder: Search by name, phone, or ID...
            - generic [ref=f1e50]:
              - button "Sync Test Patient ffab6b84 25y • F" [ref=f1e51]:
                - generic [ref=f1e52]:
                  - generic [ref=f1e53]: Sync Test Patient
                  - generic [ref=f1e54]: ffab6b84
                - generic [ref=f1e56]:
                  - generic [ref=f1e57]: 25y
                  - generic [ref=f1e58]: •
                  - generic [ref=f1e59]: F
              - button "Sync Test Patient 92f5c4c2 25y • F" [ref=f1e60]:
                - generic [ref=f1e61]:
                  - generic [ref=f1e62]: Sync Test Patient
                  - generic [ref=f1e63]: 92f5c4c2
                - generic [ref=f1e65]:
                  - generic [ref=f1e66]: 25y
                  - generic [ref=f1e67]: •
                  - generic [ref=f1e68]: F
              - button "Sync Test Patient 8a4ac210 25y • F" [ref=f1e69]:
                - generic [ref=f1e70]:
                  - generic [ref=f1e71]: Sync Test Patient
                  - generic [ref=f1e72]: 8a4ac210
                - generic [ref=f1e74]:
                  - generic [ref=f1e75]: 25y
                  - generic [ref=f1e76]: •
                  - generic [ref=f1e77]: F
              - button "Transition Test Pat 62bfbcb7 30y • female" [ref=f1e78]:
                - generic [ref=f1e79]:
                  - generic [ref=f1e80]: Transition Test Pat
                  - generic [ref=f1e81]: 62bfbcb7
                - generic [ref=f1e83]:
                  - generic [ref=f1e84]: 30y
                  - generic [ref=f1e85]: •
                  - generic [ref=f1e86]: female
              - button "Auth Test Patient 821a9735 25y • female" [ref=f1e87]:
                - generic [ref=f1e88]:
                  - generic [ref=f1e89]: Auth Test Patient
                  - generic [ref=f1e90]: 821a9735
                - generic [ref=f1e92]:
                  - generic [ref=f1e93]: 25y
                  - generic [ref=f1e94]: •
                  - generic [ref=f1e95]: female
              - generic [ref=f1e96]:
                - paragraph [ref=f1e97]: Showing 1 to 5 of 71 patients
                - generic [ref=f1e98]:
                  - button "Previous page" [disabled]
                  - button "Next page" [ref=f1e99]
        - navigation "Progress" [ref=f1e102]:
          - list [ref=f1e103]:
            - listitem [ref=f1e105]:
              - generic [ref=f1e106]:
                - generic [ref=f1e107]: "1"
                - generic [ref=f1e108]:
                  - generic [ref=f1e109]: Patient
                  - generic [ref=f1e110]: Patient information
            - listitem [ref=f1e111]:
              - generic [ref=f1e112]:
                - generic [ref=f1e113]: "2"
                - generic [ref=f1e114]:
                  - generic [ref=f1e115]: Protocol
                  - generic [ref=f1e116]: Clinical protocol
            - listitem [ref=f1e117]:
              - generic [ref=f1e118]:
                - generic [ref=f1e119]: "3"
                - generic [ref=f1e120]:
                  - generic [ref=f1e121]: Clinical
                  - generic [ref=f1e122]: Clinical assessment
            - listitem [ref=f1e123]:
              - generic [ref=f1e124]:
                - generic [ref=f1e125]: "4"
                - generic [ref=f1e126]:
                  - generic [ref=f1e127]: Destination
                  - generic [ref=f1e128]: Referral facility
            - listitem [ref=f1e129]:
              - generic [ref=f1e130]:
                - generic [ref=f1e131]: "5"
                - generic [ref=f1e132]:
                  - generic [ref=f1e133]: Confirm
                  - generic [ref=f1e134]: Review & submit
          - paragraph [ref=f1e138]: You are creating a new referral. Follow the steps to complete the process.
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=f1e144] [cursor=pointer]
  - alert [ref=f1e148]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | // Use the seeded CHO credentials from the implementation plan / backend tests
  4   | const ORIGIN_EMAIL = 'cho.wadgaon@orion.local';
  5   | const DEST_EMAIL = 'desk.dh.pune@orion.local';
  6   | const PASSWORD = 'OrionDemoPass123!';
  7   | 
  8   | test.describe('Phase 7 Offline Sync Scenarios', () => {
  9   | 
  10  |   test.beforeEach(async ({ page }) => {
  11  |     // Navigate to login and authenticate as Origin
  12  |     await page.goto('/login');
  13  |     await page.fill('input[type="email"]', ORIGIN_EMAIL);
  14  |     await page.fill('input[type="password"]', PASSWORD);
  15  |     await page.click('button[type="submit"]');
  16  |     await expect(page).toHaveURL('/app', { timeout: 30000 });
  17  |   });
  18  | 
  19  |   test('E2E 1 - Offline banner appears when offline', async ({ page, context }) => {
  20  |     await page.goto('/app/new/patient');
  21  |     await context.setOffline(true);
  22  |     
  23  |     // The banner should appear
  24  |     const banner = page.locator('text=You\'re offline. New referrals will be saved and synced');
  25  |     await expect(banner).toBeVisible();
  26  |     
  27  |     await context.setOffline(false);
  28  |   });
  29  | 
  30  |   test('E2E 2 to 5 - Offline patient/referral creation and sync', async ({ page, context }) => {
  31  |     test.setTimeout(60000); // This is a long flow
  32  |     
  33  |     // Cache the reference data first by visiting the forms online
  34  |     await page.goto('/app/new/patient');
  35  |     await page.waitForLoadState('networkidle');
  36  |     
  37  |     // Go offline
  38  |     await context.setOffline(true);
  39  |     
  40  |     // Create Patient
> 41  |     await page.fill('input[name="displayName"]', 'E2E Offline Patient');
      |                ^ Error: page.fill: Test timeout of 60000ms exceeded.
  42  |     await page.fill('input[name="age"]', '30');
  43  |     // Select sex
  44  |     await page.click('button[role="combobox"]');
  45  |     await page.click('div[role="option"]:has-text("Female")');
  46  |     await page.click('button:has-text("Continue")');
  47  |     
  48  |     // Now on protocol selection (or triage)
  49  |     await expect(page).toHaveURL(/.*\/app\/new\/triage/);
  50  |     await page.click('div:has-text("ANC Danger Signs")'); // Select protocol
  51  |     await page.click('button:has-text("Continue")');
  52  |     
  53  |     // Triage form
  54  |     await page.fill('input[name="vitals.hr"]', '90');
  55  |     await page.click('button[role="switch"]'); // Toggle a danger sign switch (first one)
  56  |     await page.click('button:has-text("Continue")');
  57  |     
  58  |     // Destination Selection
  59  |     await expect(page).toHaveURL(/.*\/app\/new\/destination/);
  60  |     
  61  |     // We should see cached destinations. Select the first one.
  62  |     await page.click('button:has-text("Select")'); 
  63  |     
  64  |     // Confirm
  65  |     await expect(page).toHaveURL(/.*\/app\/new\/confirm/);
  66  |     await page.click('button:has-text("Confirm & Create Handoff")');
  67  |     
  68  |     // Should be redirected to app dashboard
  69  |     await expect(page).toHaveURL('/app');
  70  |     
  71  |     // Verify pending/offline state
  72  |     await expect(page.locator('text=E2E Offline Patient')).toBeVisible();
  73  |     await expect(page.locator('text=Saved Offline')).toBeVisible();
  74  | 
  75  |     // Refresh browser while offline
  76  |     await page.reload();
  77  |     await expect(page.locator('text=E2E Offline Patient')).toBeVisible();
  78  |     await expect(page.locator('text=Saved Offline')).toBeVisible();
  79  | 
  80  |     // Restore network (Sync engine should trigger)
  81  |     await context.setOffline(false);
  82  |     
  83  |     // It should eventually say Synced
  84  |     await expect(page.locator('text=Synced')).toBeVisible({ timeout: 15000 });
  85  |     
  86  |     // Refresh and ensure it's still there (deduplicated)
  87  |     await page.reload();
  88  |     await expect(page.locator('text=E2E Offline Patient')).toBeVisible();
  89  |     await expect(page.locator('text=Synced')).not.toBeVisible(); // After refresh, it might not show offline tags since it's just server data
  90  |     await expect(page.locator('text=Saved Offline')).not.toBeVisible();
  91  |     
  92  |     // Ensure only ONE instance exists
  93  |     const rowCount = await page.locator('tr:has-text("E2E Offline Patient")').count();
  94  |     expect(rowCount).toBe(1);
  95  |   });
  96  | 
  97  |   test('E2E 7 - Destination workflow for synced referral', async ({ page, context }) => {
  98  |     // For destination workflow, we need to logout and login as DEST
  99  |     await page.goto('/login');
  100 |     // Clear cookies/session manually if needed, or better, use a new context
  101 |   });
  102 | });
  103 | 
```