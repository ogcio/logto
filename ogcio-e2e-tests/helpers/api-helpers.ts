import { expect } from '@playwright/test';

// Use the same URLs as integration tests expect
const logtoUrl = 'http://localhost:3301';
const logtoConsoleUrl = 'http://localhost:3302';

/**
 * Make authenticated API calls to Logto Management API using development mode
 * This uses the development-user-id header which bypasses OAuth in dev mode
 */
export async function callManagementApi(endpoint: string, options: RequestInit = {}): Promise<any> {
    // Use development-user-id header for authentication in development mode
    // This matches how integration tests work and bypasses OAuth entirely
    const response = await fetch(`${logtoConsoleUrl}/api${endpoint}`, {
        ...options,
        headers: {
            'development-user-id': 'integration-test-admin-user',
            'Content-Type': 'application/json',
            ...options.headers,
        },
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
 * Bypass login and go directly to admin console using development mode
 * This sets up the session without going through the login UI
 */
export async function bypassLoginWithApiToken(page: any, adminUrl: string = logtoConsoleUrl) {
    console.log('Bypassing login using development mode...');
    
    // In development mode, we can navigate directly to the admin console
    // The development-user-id header will handle authentication
    await page.goto(`${adminUrl}/console`);
    await page.waitForLoadState('networkidle');
    
    console.log('Current URL after navigation:', page.url());
    
    // Check if we're on the welcome page
    if (page.url().includes('/console/welcome')) {
        console.log('On welcome page, attempting to complete setup...');
        
        // Try to click through the welcome setup
        try {
            // Look for "Get started" or similar button
            const getStartedButton = page.locator('button', { hasText: /get started|continue|next/i });
            if (await getStartedButton.isVisible()) {
                await getStartedButton.click();
                await page.waitForLoadState('networkidle');
            }
        } catch (error) {
            console.log('Could not find get started button:', error);
        }
        
        // If still on welcome, try direct navigation
        if (page.url().includes('/console/welcome')) {
            console.log('Still on welcome, trying direct navigation to dashboard...');
            await page.goto(`${adminUrl}/console/dashboard`);
            await page.waitForLoadState('networkidle');
        }
    }
}

/**
 * Create a user via API instead of UI
 */
export async function createUserViaApi(email: string, phone: string | null, username: string, displayName: string) {
    console.log('Creating user via API:', username);
    
    const userData: any = {
        username,
        primaryEmail: email,
        name: displayName,
    };
    
    if (phone) {
        userData.primaryPhone = phone;
    }
    
    const user = await callManagementApi('/users', {
        method: 'POST',
        body: JSON.stringify(userData),
    });
    
    console.log('User created via API:', user.id);
    return user;
}

/**
 * Get roles via API
 */
export async function getRolesViaApi() {
    return callManagementApi('/roles');
}

/**
 * Assign roles to user via API
 */
export async function assignRolesToUserViaApi(userId: string, roleIds: string[]) {
    return callManagementApi(`/users/${userId}/roles`, {
        method: 'POST',
        body: JSON.stringify({ roleIds }),
    });
}

/**
 * Delete user via API
 */
export async function deleteUserViaApi(userId: string) {
    try {
        await callManagementApi(`/users/${userId}`, {
            method: 'DELETE',
        });
    } catch (error) {
        // Ignore 404 errors (user already deleted)
        if (!error.message.includes('404')) {
            throw error;
        }
    }
}
