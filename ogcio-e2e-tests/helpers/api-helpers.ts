const logtoUrl = 'http://localhost:3301';
const logtoConsoleUrl = 'http://localhost:3301'; // Use core port 3301 to access default tenant data

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
        body: JSON.stringify({ roleIds: roles }),
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
