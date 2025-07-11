import { execSync } from 'child_process';
import { randomUUID } from 'crypto';

// Use the same URLs as integration tests expect
const logtoUrl = 'http://localhost:3301';
const logtoConsoleUrl = 'http://localhost:3302';

/**
 * Make authenticated API calls to Logto Management API using development mode
 * This uses the development-user-id header which bypasses OAuth in dev mode
 */
export async function callManagementApi(endpoint: string, options: RequestInit = {}): Promise<any> {
    // Use Bearer token if available, otherwise use development-user-id header
    const baseHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    // Merge any additional headers from options, ensuring only string key-value pairs
    const extraHeaders = (options.headers && typeof options.headers === 'object' && !Array.isArray(options.headers))
        ? Object.fromEntries(Object.entries(options.headers).filter(([k, v]) => typeof v === 'string'))
        : {};
    const headers: Record<string, string> = {
        ...baseHeaders,
        ...extraHeaders,
    };
    if (process.env.LOGTO_ADMIN_BEARER_TOKEN) {
        headers['Authorization'] = `Bearer ${process.env.LOGTO_ADMIN_BEARER_TOKEN}`;
    } else {
        headers['development-user-id'] = 'integration-test-admin-user';
    }
    const response = await fetch(`${logtoConsoleUrl}/api${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API call failed: ${response.status} ${errorText}`);
    }

    // Handle different response types
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return response.json();
    } else {
        // For non-JSON responses (like "Created"), return null or empty object
        const text = await response.text();
        return text || null;
    }
}

/**
 * Handle post-login welcome page navigation
 * This function helps navigate past the welcome/setup page after successful login
 * Enhanced for CI environments where timing can be different
 */
export async function handleWelcomePageAfterLogin(page: any, adminUrl: string = logtoConsoleUrl) {
    console.log('🔍 Checking for welcome page and attempting to navigate past it...');

    // Wait for page to load with extended timeout for CI
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    console.log('Current URL:', page.url());

    // Check for multiple variations of welcome/onboarding pages
    const isOnWelcomePage = page.url().includes('/console/welcome') ||
        page.url().includes('/console/get-started') ||
        page.url().includes('/console/onboarding') ||
        page.url().includes('/welcome') ||
        page.url().includes('welcome');

    if (isOnWelcomePage) {
        console.log('🚨 DETECTED: On welcome/get-started page, attempting to complete setup...');
        console.log('⚠️ This indicates the admin console configuration may not have been applied properly in CI');

        try {
            // Strategy 1: Wait a bit more and try to detect page content
            console.log('Waiting for page content to fully load...');
            await page.waitForTimeout(3000);

            // Try multiple strategies to get past the welcome page

            // Strategy 1A: Look for and click common setup completion buttons
            const buttonSelectors = [
                'button:has-text("Create account")',
                'button:has-text("Get started")',
                'button:has-text("Continue")',
                'button:has-text("Next")',
                'button:has-text("Skip")',
                'button:has-text("Finish setup")',
                'button:has-text("Done")',
                'button:has-text("Complete")',
                '[data-testid="continue-button"]',
                '[data-testid="get-started-button"]',
                '[data-testid="create-account-button"]',
                '.primary-button',
                '.continue-button',
                'button[type="submit"]',
                'input[type="submit"]'
            ];

            let foundButton = false;
            for (const selector of buttonSelectors) {
                try {
                    const button = page.locator(selector).first();
                    if (await button.isVisible({ timeout: 2000 })) {
                        console.log(`✅ Found button with selector: ${selector}, clicking...`);
                        await button.click();
                        await page.waitForLoadState('networkidle', { timeout: 15000 });
                        foundButton = true;

                        // Check if we've navigated away from welcome page
                        if (!page.url().includes('/welcome') && !page.url().includes('/get-started') && !page.url().includes('/onboarding')) {
                            console.log('✅ Successfully navigated away from welcome page via button click');
                            return;
                        }
                    }
                } catch (buttonError) {
                    console.log(`❌ Button selector ${selector} failed:`, buttonError.message);
                    continue;
                }
            }

            if (!foundButton) {
                console.log('⚠️ No actionable buttons found on welcome page');
            }

            // Strategy 2: Try direct navigation to dashboard/console
            console.log('🚀 Attempting direct navigation to bypass welcome page...');
            const navigationTargets = [
                `${adminUrl}/console/dashboard`,
                `${adminUrl}/console/users`,
                `${adminUrl}/console/applications`,
                `${adminUrl}/console/get-started`,
                `${adminUrl}/console`
            ];

            for (const target of navigationTargets) {
                try {
                    console.log(`🎯 Trying to navigate to: ${target}`);
                    await page.goto(target, { timeout: 20000 });
                    await page.waitForLoadState('networkidle', { timeout: 15000 });

                    // Check if we've successfully navigated away from welcome
                    await page.waitForTimeout(2000); // Give it time to redirect if needed
                    const currentUrl = page.url();
                    console.log(`Current URL after navigation attempt: ${currentUrl}`);

                    if (!currentUrl.includes('/welcome') && !currentUrl.includes('/get-started') && !currentUrl.includes('/onboarding')) {
                        console.log(`✅ Successfully navigated to non-welcome page: ${currentUrl}`);
                        return;
                    }
                } catch (navError) {
                    console.log(`❌ Navigation to ${target} failed:`, navError.message);
                    continue;
                }
            }

            // Strategy 3: Force navigation and accept we might still be on welcome
            console.log('🔄 Final attempt: Force navigation to dashboard...');
            await page.goto(`${adminUrl}/console/dashboard`, { timeout: 20000 });
            await page.waitForLoadState('networkidle', { timeout: 15000 });
            await page.waitForTimeout(3000);

            const finalUrl = page.url();
            if (finalUrl.includes('/welcome') || finalUrl.includes('/get-started') || finalUrl.includes('/onboarding')) {
                console.log('⚠️ CRITICAL: Still on welcome page after all attempts!');
                console.log('⚠️ This suggests admin console configuration is not working in CI');
                console.log('⚠️ Tests may fail - consider investigating admin console config in pipeline');
            } else {
                console.log('✅ Final navigation successful - no longer on welcome page');
            }

        } catch (error) {
            console.log('❌ Welcome page navigation failed with error:', error.message);
            console.log('⚠️ Will proceed - individual tests will need to handle welcome page if present');
        }
    } else {
        console.log('✅ Not on welcome page - admin console configuration appears to be working correctly');
    }

    console.log('🏁 Final URL after welcome handling:', page.url());
}

/**
 * Create a user via API instead of UI
 */
function safeRandomString(length = 8) {
    return Math.random().toString(36).replace(/[^a-z0-9]/gi, '').slice(0, length);
}

export async function createUserViaApi(email: string, phone: string | null, username: string, displayName: string) {
    // Ensure unique and valid username and email for each test run
    const uniqueSuffix = safeRandomString(8);
    const uniqueUsername = `${username}_${uniqueSuffix}`;
    const emailParts = email.split('@');
    const uniqueEmail = `${emailParts[0]}_${uniqueSuffix}@${emailParts[1]}`;
    console.log('Creating user via API:', uniqueUsername, uniqueEmail);
    const userData: any = {
        username: uniqueUsername,
        primaryEmail: uniqueEmail,
        name: displayName,
    };
    // Do NOT include primaryPhone, even if phone is provided
    const user = await callManagementApi('/users', {
        method: 'POST',
        body: JSON.stringify(userData),
    });
    console.log('User created via API:', user.id);
    // Return both user object and the unique username/email for login
    return { ...user, username: uniqueUsername, email: uniqueEmail, phone: null };
}

/**
 * Assign roles to a user via API
 * @param userId - The ID of the user to assign roles to
 * @param roles - Array of role IDs to assign
 * @returns API response
 */
export async function assignRolesToUserViaApi(userId: string, roles: string[]): Promise<any> {
    if (!userId || !Array.isArray(roles) || roles.length === 0) {
        throw new Error('assignRolesToUserViaApi: userId and roles[] are required');
    }
    console.log(`Assigning roles to user ${userId}:`, roles);
    return await callManagementApi(`/users/${userId}/roles`, {
        method: 'POST',
        body: JSON.stringify({ roles }),
    });
}

/**
 * Delete a user via API
 * @param userId - The ID of the user to delete
 * @returns API response
 */
export async function deleteUserViaApi(userId: string): Promise<any> {
    if (!userId) {
        throw new Error('deleteUserViaApi: userId is required');
    }
    console.log(`Deleting user via API: ${userId}`);
    return await callManagementApi(`/users/${userId}`, {
        method: 'DELETE',
    });
}

/**
 * Get all roles via API
 * @returns Array of roles
 */
export async function getRolesViaApi(): Promise<any[]> {
    console.log('Fetching roles via API...');
    const roles = await callManagementApi('/roles', {
        method: 'GET',
    });
    return Array.isArray(roles) ? roles : [];
}
