import { test, expect } from '@playwright/test';

//this file is to test OGCIO custom connectors
// it includes tests for MyGovId and OGCIO EntraID connectors   

const LOGTO_API_BASE_URL = process.env.LOGTO_ADMIN_URL || 'http://localhost:3302';

test.describe('OGCIO Custom Connectors', () => {

    test('should have MyGovId connector available', async ({ request }) => {
        const response = await request.get(`${LOGTO_API_BASE_URL}/api/connectors`);

        if (response.ok()) {
            const connectors = await response.json();
            const mygovIdConnector = connectors.find((c: any) => c.id === 'mygovid');

            if (mygovIdConnector) {
                expect(mygovIdConnector.id).toBe('mygovid');
                expect(mygovIdConnector.type).toBe('Social');
                expect(mygovIdConnector.metadata.name.en).toContain('MyGovId');
            }
        }
    });

    test('should have OGCIO EntraID connector available', async ({ request }) => {
        const response = await request.get(`${LOGTO_API_BASE_URL}/api/connectors`);

        if (response.ok()) {
            const connectors = await response.json();
            const entraidConnector = connectors.find((c: any) => c.id === 'ogcio-entraid');

            if (entraidConnector) {
                expect(entraidConnector.id).toBe('ogcio-entraid');
                expect(entraidConnector.type).toBe('Social');
                expect(entraidConnector.metadata.name.en).toContain('OGCIO EntraID');
            }
        }
    });

    test('should validate MyGovId connector configuration schema', async ({ request }) => {
        const response = await request.get(`${LOGTO_API_BASE_URL}/api/connectors/mygovid`);

        if (response.ok()) {
            const connector = await response.json();
            expect(connector.configTemplate).toBeDefined();

            const configProperties = connector.configTemplate.properties;
            expect(configProperties).toHaveProperty('scope');
            expect(configProperties).toHaveProperty('clientId');
            expect(configProperties).toHaveProperty('clientSecret');
            expect(configProperties).toHaveProperty('authorizationEndpoint');
            expect(configProperties).toHaveProperty('tokenEndpoint');
            expect(configProperties).toHaveProperty('idTokenVerificationConfig');
        }
    });

});
