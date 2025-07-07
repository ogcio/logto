import { test, expect } from '@playwright/test';

//this file is to test custom ogcio user flows
// such as creating users, assigning roles, and deleting users

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

    test('An admin can create user and assign/delete roles and then delete the user', async ({ page }) => {
        const username = 'playwrightusername';

        await page.goto(LOGTO_ADMIN_URL);
        await page.locator('input[name="identifier"]').fill(TEST_USERNAME);
        await page.locator('input[name="password"]').fill(TEST_PASSWORD);
        await page.getByRole('button', { name: 'Sign in' }).click();

        //Add new user
        await page.getByRole('link', { name: 'User management' }).click();
        await page.getByRole('button', { name: 'Add user' }).click();
        await page.getByRole('textbox').nth(0).fill('playwrighttest@test.com');
        await page.getByRole('textbox').nth(1).fill('123456789');
        await page.getByRole('textbox').nth(2).fill(username);
        await page.getByRole('textbox').nth(3).fill('playwright user');
        await page.getByRole('button', { name: 'Add user' }).click();

        //Navigate to user details > Roles
        await page.getByRole('button', { name: 'Check user detail' }).click();
        await page.getByRole('navigation').getByRole('link', { name: 'Roles' }).click();
        await page.getByRole('button', { name: 'Assign roles' }).click();
        await expect(page.getByRole('button', { name: 'Onboarded citizen' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Citizen', exact: true })).toBeVisible();
        await expect(page.getByRole('button', { name: 'FormsIE Admin' })).toBeVisible();

        //check all 3 roles can be assigned
        await page.getByRole('button', { name: 'Citizen', exact: true }).click();
        await page.getByRole('button', { name: 'FormsIE Admin' }).click();
        await page.getByRole('button', { name: 'Onboarded citizen' }).click();
        await page.getByRole('button', { name: 'Assign role' }).click();

        //check all 3 roles can be deleted
        await page.getByRole('row', { name: 'Citizen' }).first().getByRole('button').click();
        await page.getByRole('button', { name: 'Remove' }).click();
        await page.getByRole('row', { name: 'FormsIE Admin' }).getByRole('button').click();
        await page.getByRole('button', { name: 'Remove' }).click();
        await page.getByRole('row', { name: 'Onboarded citizen' }).getByRole('button').click();
        await page.getByRole('button', { name: 'Remove' }).click();

        //delete the user
        await page.locator('button').nth(1).click();
        await page.getByRole('menuitem', { name: 'Delete' }).click();
        await page.getByRole('button', { name: 'Delete' }).click();
        await expect(page.getByRole('row', { name: username })).not.toBeVisible();
    });
});
