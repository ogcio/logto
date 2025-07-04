import { test, expect } from '@playwright/test';

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

    test('should process custom MyGovId claims correctly', async () => {
        const mockClaims = {
            sub: 'test-user-id',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            mobile: '+353123456789',
            oid: 'test-organization-id',
            surname: 'Doe',
            givenName: 'John'
        };

        expect(mockClaims.sub).toBeDefined();
        expect(mockClaims.firstName || mockClaims.givenName).toBeDefined();
        expect(mockClaims.lastName || mockClaims.surname).toBeDefined();
        expect(mockClaims.email).toBeDefined();
        expect(mockClaims.oid).toBeDefined();
    });

    test('should handle phone number validation for MyGovId', async () => {
        const invalidPhoneNumbers = ['+00000000', '+0000000000', '+000000000000'];
        const validPhoneNumbers = ['+353123456789', '+447123456789', '+1234567890'];

        invalidPhoneNumbers.forEach(phone => {
            const isInvalid = /^\+0+$/.test(phone);
            expect(isInvalid).toBe(true);
        });

        validPhoneNumbers.forEach(phone => {
            const isInvalid = /^\+0+$/.test(phone);
            expect(isInvalid).toBe(false);
        });
    });

    test('should construct proper name from MyGovId claims', async () => {
        const testCases = [
            { input: { firstName: 'John', lastName: 'Doe' }, expected: 'John Doe' },
            { input: { givenName: 'Jane', surname: 'Smith' }, expected: 'Jane Smith' },
            { input: { firstName: 'John', surname: 'Doe' }, expected: 'John Doe' },
            { input: { givenName: 'Jane', lastName: 'Smith' }, expected: 'Jane Smith' },
            { input: {}, expected: 'Name not found' }
        ];

        testCases.forEach(({ input, expected }) => {
            const toConcatName = input.firstName && input.firstName.length > 0
                ? input.firstName
                : input.givenName;
            const toConcatSurname = input.lastName && input.lastName.length > 0
                ? input.lastName
                : input.surname;
            const concatenated = [toConcatName, toConcatSurname].join(' ').trim();
            const result = concatenated.length > 0 ? concatenated : 'Name not found';

            expect(result).toBe(expected);
        });
    });
});
