import { test, expect } from '@playwright/test';

const MYGOVID_MOCK_BASE_URL = process.env.MYGOVID_MOCK_URL || 'http://localhost:4005';
const LOGTO_BASE_URL = process.env.LOGTO_BASE_URL || 'http://localhost:3301';
const CALLBACK_URL = `${LOGTO_BASE_URL}/callback`;

test.describe('MyGovId Mock Service - Custom OGCIO Functionality', () => {

    test('should provide health check endpoint', async ({ page }) => {
        const response = await page.goto(`${MYGOVID_MOCK_BASE_URL}/health`);
        expect(response?.ok()).toBe(true);

        const content = await page.textContent('body');
        expect(content).toContain('ok');
    });

    test('should serve OIDC auth endpoint with custom parameters', async ({ page }) => {
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
        await expect(page.locator('input[name="firstName"]')).toBeAttached();
        await expect(page.locator('input[name="lastName"]')).toBeAttached();
        await expect(page.locator('input[name="email"]')).toBeAttached();
        await expect(page.locator('input[name="password"]')).toBeVisible();
        await expect(page.locator('input[name="sub"]')).toBeAttached();
        await expect(page.locator('input[name="oid"]')).toBeAttached();
    });

    test('should handle custom MyGovId authentication flow', async ({ page }) => {
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
        await page.click('button[type="submit"]');

        await page.waitForURL(/.*callback.*code=.*/);
        const currentUrl = page.url();
        expect(currentUrl).toContain('code=');
        expect(currentUrl).toContain('state=test-state');
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
        expect(typeof body.id_token).toBe('string');
    });

    test('should provide OIDC discovery endpoint', async ({ request }) => {
        const authResponse = await request.get(`${MYGOVID_MOCK_BASE_URL}/logto/mock/auth?response_type=code&client_id=test&redirect_uri=${encodeURIComponent(CALLBACK_URL)}&state=test&nonce=test&scope=openid`);
        expect(authResponse.ok()).toBe(true);

        const content = await authResponse.text();
        expect(content).toContain('<form');
        expect(content).toContain('password');
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

    test('should reject invalid credentials', async ({ page }) => {
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
        await page.click('button[type="submit"]');

        await page.waitForURL(/.*\/logto\/mock\/auth.*/);
        expect(page.url()).toContain('/logto/mock/auth');
    });
});
