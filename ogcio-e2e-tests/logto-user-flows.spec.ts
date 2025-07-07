import { test, expect } from '@playwright/test';

const LOGTO_ADMIN_URL = process.env.LOGTO_ADMIN_URL || 'http://localhost:3302';

const TEST_USERNAME = process.env.TEST_USERNAME;
const TEST_PASSWORD = process.env.TEST_PASSWORD;

// Ensure required environment variables are set
if (!TEST_USERNAME) {
    throw new Error('TEST_USERNAME environment variable is required');
}
if (!TEST_PASSWORD) {
    throw new Error('TEST_PASSWORD environment variable is required');
}

test.describe('Logto User Flows - OGCIO E2E Tests', () => {

    test('Possible roles for new users should be correct', async ({ page }) => {
        const username = 'playwrightusername';

        await page.goto(LOGTO_ADMIN_URL);
        await page.locator('input[name="identifier"]').fill(TEST_USERNAME);
        await page.locator('input[name="password"]').fill(TEST_PASSWORD);
        await page.getByRole('button', { name: 'Sign in' }).click();

        await page.getByRole('link', { name: 'User management' }).click();
        await page.getByRole('button', { name: 'Add user' }).click();
        //input user details, email, phonenumber, username and name
        await page.getByRole('textbox').nth(0).fill('playwrighttest@test.com');
        await page.getByRole('textbox').nth(1).fill('123456789');
        await page.getByRole('textbox').nth(2).fill(username);
        await page.getByRole('textbox').nth(3).fill('playwright user');
        //click add user button
        await page.getByRole('button', { name: 'Add user' }).click();
        await page.getByRole('button', { name: 'Check user detail' }).click();
        await page.getByRole('navigation').getByRole('link', { name: 'Roles' }).click();
        await page.getByRole('button', { name: 'Assign roles' }).click();
        await expect(page.getByRole('button', { name: 'Onboarded citizen' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Citizen' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'FormsIE Admin' })).toBeVisible();
    });
});
