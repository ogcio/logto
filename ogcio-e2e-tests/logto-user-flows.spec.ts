import { test, expect } from '@playwright/test';
import { addNewUser, loginToLogtoAdmin } from './helpers/functions';
import {
    createUserViaApi,
    getRolesViaApi,
    assignRolesToUserViaApi,
    deleteUserViaApi,
    forceBypassWelcomePageConfig,

} from './helpers/api-helpers';

// this file is to test custom ogcio user flows and data
// such as creating users, assigning roles, and deleting users

const LOGTO_ADMIN_URL = process.env.LOGTO_ADMIN_URL || 'http://localhost:3302';

const TEST_USERNAME = process.env.TEST_USERNAME || 'playwrighttest';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Playwright-test123!!!';

test.describe('Logto User Flows - OGCIO E2E Tests', () => {

    // Use direct UI login for reliability in CI
    test.beforeEach(async ({ page }) => {
        // Ensure admin user exists before UI login
        await createUserViaApi(
            'playwrighttest@test.com',
            '123456789',
            TEST_USERNAME,
            'playwright admin user'
        );
        console.log('Ensured admin user exists via API. Proceeding to UI login...');
        await page.goto(`${LOGTO_ADMIN_URL}/console/login`);
        await page.getByPlaceholder('Username').fill(TEST_USERNAME);
        await page.getByPlaceholder('Password').fill(TEST_PASSWORD);
        await page.getByRole('button', { name: 'Sign in' }).click();
        await page.waitForLoadState('networkidle', { timeout: 15000 });
        // If stuck on /welcome, retry navigation to dashboard
        if (page.url().includes('/welcome')) {
            console.log('Detected /welcome after login, retrying navigation to dashboard...');
            await page.goto(`${LOGTO_ADMIN_URL}/console/dashboard`, { timeout: 20000 });
            await page.waitForLoadState('networkidle', { timeout: 15000 });
            if (page.url().includes('/welcome')) {
                throw new Error('Still stuck on /welcome after admin user creation and dashboard navigation. Check admin user status.');
            }
        }
        console.log('Successfully logged in and bypassed /welcome.');
    });

    test('An admin can create user and assign/delete roles and then delete the user', async ({ page }) => {
        const username = `playwrightusername${Date.now()}`;

        // Method 1: Try creating user via API first (faster and more reliable)
        try {
            console.log('Attempting to create user via API...');
            const user = await createUserViaApi('playwrighttest@test.com', '123456789', username, 'playwright user');

            // Get available roles
            const roles = await getRolesViaApi();
            const targetRoles = roles.filter((role: any) =>
                ['Onboarded citizen', 'Citizen', 'FormsIE Admin'].includes(role.name)
            );

            if (targetRoles.length > 0) {
                console.log('Assigning roles via API...');
                await assignRolesToUserViaApi(user.id, targetRoles.map((role: any) => role.id));
            }

            // Now verify in UI that user was created
            await page.goto(`${LOGTO_ADMIN_URL}/console/users`);
            await page.waitForLoadState('networkidle');

            // Search for the user
            await page.getByPlaceholder('Search').fill(username);
            await page.waitForTimeout(1000); // Wait for search

            // Check user exists
            await expect(page.getByText(username)).toBeVisible();

            // Check user details and roles
            await page.getByRole('button', { name: 'Check user detail' }).click();
            await page.getByRole('navigation').getByRole('link', { name: 'Roles' }).click();

            // Verify roles were assigned
            for (const role of targetRoles) {
                await expect(page.getByText(role.name)).toBeVisible();
            }

            // Clean up via API
            await deleteUserViaApi(user.id);
            console.log('✅ API-based test completed successfully');

        } catch (apiError) {
            console.log('API approach failed, falling back to UI:', apiError.message);

            // Fallback to original UI-based approach
            await addNewUser(page, 'playwrighttest@test.com', '123456789', username, 'playwright user');

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
        }
    });

    test('should show OGCIO custom connectors in the admin console', async ({ page }) => {
        // Navigate to Connectors section
        await page.getByRole('link', { name: 'Connectors' }).click();
        await page.getByRole('link', { name: 'Social connectors' }).click();

        // Check for OGCIO custom connectors
        await expect(page.locator('div').filter({ hasText: /^MyGovIdMyGovIdIn useOGCIO EntraIDSocial connectorIn use$/ }).first()).toBeVisible();
    });

    test('branding should be correct', async ({ page }) => {
        // Navigate to Sign-in experience section
        await page.getByRole('link', { name: 'Sign-in experience' }).click();
        const primaryColor = await page.locator('input[name="color.primaryColor"]').inputValue();
        expect(primaryColor).toBe('#004d44');
        //expect company logo field to not be empty
        const companyLogo = await page.getByRole('textbox', { name: 'https://your.cdn.domain/logo.' }).inputValue();
        expect(companyLogo).not.toBe('');
        //Click content link
        await page.getByRole('link', { name: 'Content' }).click();
        const termsOfUseUrl = await page.locator('input[name="termsOfUseUrl"]').inputValue();
        expect(termsOfUseUrl).toContain('/terms-of-use');
        const privacyPolicyUrl = await page.locator('input[name="privacyPolicyUrl"]').inputValue();
        expect(privacyPolicyUrl).toContain('/privacy-policy');
        await expect(page.getByText('Continue to automatically agree to terms')).toBeVisible()
        //Click password policy link
        await page.getByRole('link', { name: 'Password policy' }).click();
        const minLength = await page.locator('input[name="passwordPolicy.length.min"]').inputValue();
        expect(minLength).toBe('8');
    });

    test('29 Applications should be listed', async ({ page }) => {
        // Navigate to Applications link
        await page.getByRole('link', { name: 'Applications' }).click();
        await expect(page.getByText('1-20 of 29')).toBeVisible();
    });

    test('check all roles are listed', async ({ page }) => {
        // Navigate to Roles link
        await page.getByRole('link', { name: 'Roles', exact: true }).click();
        await expect(page.getByRole('row', { name: 'Logto Management API access' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Citizen', exact: true })).toBeVisible();
        await expect(page.getByRole('row', { name: 'FormsIE Admin' })).toBeVisible();
        await expect(page.getByRole('row', { name: 'M2M Citizen Profile Reader role' })).toBeVisible();
        await expect(page.getByRole('row', { name: 'M2M Public Servant Profile role' })).toBeVisible();
        await expect(page.getByRole('row', { name: 'M2M E2E Messaging Citizen' })).toBeVisible();
        await expect(page.getByRole('row', { name: 'M2M Messaging Public Servant' })).toBeVisible();
        await expect(page.getByRole('row', { name: 'M2M Onboarding' })).toBeVisible();
        await expect(page.getByRole('row', { name: 'M2M E2E Profile Citizen' })).toBeVisible();
        await expect(page.getByRole('row', { name: 'M2M Citizen Journey Reader role' })).toBeVisible();
        await expect(page.getByRole('row', { name: 'M2M Public Servant Journey Reader role' })).toBeVisible();
        await expect(page.getByRole('row', { name: 'Onboarded citizen' })).toBeVisible();
    });

    test('check all organisations are listed', async ({ page }) => {
        // Navigate to Organisations link
        await page.getByRole('link', { name: 'Organizations' }).click();
        // Check for specific organisation names
        await expect(page.getByRole('row', { name: 'OGCIO Seeded Org' })).toBeVisible();
        await expect(page.getByRole('row', { name: 'An Bord Pleanála' })).toBeVisible();
        await expect(page.getByRole('row', { name: 'Inactive Public Servants Org' })).toBeVisible();
        await expect(page.getByRole('row', { name: 'First Testing Organisation' })).toBeVisible();
        await expect(page.getByRole('row', { name: 'Second Testing Organisation' })).toBeVisible();
        await expect(page.getByRole('row', { name: 'Health Service Executive' })).toBeVisible();
        await expect(page.getByRole('row', { name: 'Department of Social Protection' })).toBeVisible();
        await expect(page.getByRole('row', { name: 'Dept. of Education/An Roinn Oideachais' })).toBeVisible();
        await expect(page.getByRole('row', { name: 'Limerick City and County Council' })).toBeVisible();
        await expect(page.getByRole('row', { name: 'Messaging Test' })).toBeVisible();

    });

    test('check all API resources are listed', async ({ page }) => {
        // Navigate to API resources link
        await page.getByRole('link', { name: 'API resources' }).click();
        // Check for all API resources
        await expect(page.getByRole('row', { name: 'Logto Management API' })).toBeVisible();
        await expect(page.getByRole('row', { name: 'Payments Building Block API' })).toBeVisible();
        await expect(page.getByRole('row', { name: 'Messaging Building Block API' })).toBeVisible();
        await expect(page.getByRole('row', { name: 'Scheduler Building Block API' })).toBeVisible();
        await expect(page.getByRole('row', { name: 'Profile Building Block API' })).toBeVisible();
        await expect(page.getByRole('row', { name: 'File Upload Service API' })).toBeVisible();
        await expect(page.getByRole('row', { name: 'Journey Building Block API' })).toBeVisible();
        await expect(page.getByRole('row', { name: 'Analytics Building Block API' })).toBeVisible();
        await expect(page.getByRole('row', { name: 'Observability Open Telemetry Collector HTTP' })).toBeVisible();
        await expect(page.getByRole('row', { name: 'Observability Open Telemetry Collector GRPC' })).toBeVisible();
        await expect(page.getByRole('row', { name: 'Observability Dashboard Application' })).toBeVisible();
        await expect(page.getByRole('row', { name: 'FormsIE Submissions API' })).toBeVisible();
    });
});
