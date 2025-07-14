import { test, expect } from '@playwright/test';

//this file is to test mygovid mock service
// it includes comprehensive tests for the MyGovId mock service endpoints and functionality
// it covers health check, OIDC auth endpoint, token endpoint, JWKS endpoint, form submission,
// custom authentication flow, discovery endpoint, invalid credentials handling, and logout endpoint

const MYGOVID_MOCK_BASE_URL = process.env.MYGOVID_MOCK_URL || 'http://localhost:4005';
const LOGTO_BASE_URL = process.env.LOGTO_API_URL || 'http://localhost:3001';
const CALLBACK_URL = `${LOGTO_BASE_URL}/callback`;

test.describe('MyGovId Mock Service - Comprehensive Tests', () => {

    test('should provide health check endpoint', async ({ request }) => {
        const response = await request.get(`${MYGOVID_MOCK_BASE_URL}/health`);
        expect(response.ok()).toBe(true);

        const content = await response.json();
        expect(content).toHaveProperty('status');
        expect(content.status).toBe('ok');
    });

    test('should serve OIDC auth endpoint with all required form fields', async ({ page }) => {
        const authParams = new URLSearchParams({
            response_type: 'code',
            client_id: 'test-client',
            redirect_uri: CALLBACK_URL,
            state: 'test-state',
            nonce: 'test-nonce',
            scope: 'openid profile email'
        });

        await page.goto(`${MYGOVID_MOCK_BASE_URL}/logto/mock/auth?${authParams}`);

        await expect(page.locator('form')).toBeVisible();
        await expect(page.locator('input[name="password"]')).toBeVisible();
        await expect(page.locator('input[name="firstName"]')).toBeAttached();
        await expect(page.locator('input[name="lastName"]')).toBeAttached();
        await expect(page.locator('input[name="email"]')).toBeAttached();
        await expect(page.locator('input[name="sub"]')).toBeAttached();
        await expect(page.locator('input[name="oid"]')).toBeAttached();

        const formContent = await page.content();
        expect(formContent).toContain('test-state');
        expect(formContent).toContain(CALLBACK_URL);
    });

    test('should provide OIDC token endpoint', async ({ request }) => {
        const response = await request.post(`${MYGOVID_MOCK_BASE_URL}/logto/mock/token`, {
            form: {
                code: 'test-code',
                grant_type: 'authorization_code',
                redirect_uri: CALLBACK_URL,
                client_id: 'test-client',
                client_secret: 'test-secret'
            }
        });

        expect(response.ok()).toBe(true);
        const body = await response.json();
        expect(body).toHaveProperty('id_token');
        expect(body).toHaveProperty('access_token');
        expect(body).toHaveProperty('token_type');
        expect(body.token_type).toBe('Bearer');
        expect(typeof body.id_token).toBe('string');
    });

    test('should provide JWKS endpoint', async ({ request }) => {
        const response = await request.get(`${MYGOVID_MOCK_BASE_URL}/logto/mock/keys`);

        expect(response.ok()).toBe(true);
        const jwks = await response.json();

        expect(jwks).toHaveProperty('keys');
        expect(Array.isArray(jwks.keys)).toBe(true);
        expect(jwks.keys.length).toBeGreaterThan(0);

        const key = jwks.keys[0];
        expect(key).toHaveProperty('kty');
        expect(key).toHaveProperty('use');
        expect(key).toHaveProperty('kid');
        expect(key.kid).toBe('signingkey.mygovid.v1');
        expect(key.use).toBe('sig');
    });

    test('should handle form submission with valid credentials', async ({ page }) => {
        const authParams = new URLSearchParams({
            response_type: 'code',
            client_id: 'test-client',
            redirect_uri: CALLBACK_URL,
            state: 'test-state',
            nonce: 'test-nonce',
            scope: 'openid profile email'
        });

        await page.goto(`${MYGOVID_MOCK_BASE_URL}/logto/mock/auth?${authParams}`);
        await page.fill('input[name="password"]', '123');

        const [response] = await Promise.all([
            page.waitForResponse(response => response.url().includes('/logto/mock/login')),
            page.click('button[type="submit"]')
        ]);

        expect(response.status()).toBe(302);
        const location = response.headers()['location'];
        expect(location).toContain('callback');
        expect(location).toContain('code=');
        expect(location).toContain('state=test-state');
    });

    test('should handle custom MyGovId authentication flow with response redirect', async ({ page }) => {
        const authParams = new URLSearchParams({
            response_type: 'code',
            client_id: 'test-client',
            redirect_uri: CALLBACK_URL,
            state: 'test-state',
            nonce: 'test-nonce',
            scope: 'openid profile email'
        });

        await page.goto(`${MYGOVID_MOCK_BASE_URL}/logto/mock/auth?${authParams}`);
        await page.fill('input[name="password"]', '123');
        
        // Use response-based approach instead of URL waiting
        const [response] = await Promise.all([
            page.waitForResponse(response => response.url().includes('/logto/mock/login')),
            page.click('button[type="submit"]')
        ]);

        expect(response.status()).toBe(302);
        const location = response.headers()['location'];
        expect(location).toContain('code=');
        expect(location).toContain('state=test-state');
    });

    test('should provide OIDC discovery endpoint', async ({ request }) => {
        const authResponse = await request.get(`${MYGOVID_MOCK_BASE_URL}/logto/mock/auth?response_type=code&client_id=test&redirect_uri=${encodeURIComponent(CALLBACK_URL)}&state=test&nonce=test&scope=openid`);
        expect(authResponse.ok()).toBe(true);

        const content = await authResponse.text();
        expect(content).toContain('<form');
        expect(content).toContain('password');
    });

    test('should reject invalid password (response method)', async ({ page }) => {
        const authParams = new URLSearchParams({
            response_type: 'code',
            client_id: 'test-client',
            redirect_uri: CALLBACK_URL,
            state: 'test-state',
            nonce: 'test-nonce',
            scope: 'openid profile email'
        });

        await page.goto(`${MYGOVID_MOCK_BASE_URL}/logto/mock/auth?${authParams}`);
        await page.fill('input[name="password"]', 'wrong-password');

        const [response] = await Promise.all([
            page.waitForResponse(response => response.url().includes('/logto/mock/login')),
            page.click('button[type="submit"]')
        ]);

        expect(response.status()).toBe(302);
        const location = response.headers()['location'];
        expect(location).toContain('/logto/mock/auth');
    });


    test('should handle logout endpoint', async ({ request }) => {
        const logoutUrl = `${MYGOVID_MOCK_BASE_URL}/logto/mock/logout?post_logout_redirect_uri=http://example.com/logged-out`;

        const response = await request.get(logoutUrl, {
            maxRedirects: 0
        });

        expect(response.status()).toBe(302);
        const location = response.headers()['location'];
        expect(location).toBe('http://example.com/logged-out');
    });
});
