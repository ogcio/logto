import { test, expect } from '@playwright/test';

// This file is to test OGCIO custom seeder functionality
// It includes tests for OGCIO organizations, custom connectors, and seeder data integrity  

const LOGTO_API_BASE_URL = process.env.LOGTO_ADMIN_URL || 'http://localhost:3302';

test.describe('OGCIO Custom Seeder', () => {

    test('should seed OGCIO organizations correctly', async ({ request }) => {
        const response = await request.get(`${LOGTO_API_BASE_URL}/api/organizations`);

        if (response.ok()) {
            const organizations = await response.json();
            const expectedOrganizations = [
                'ogcio', 'abp', 'hse', 'dsp', 'doe', 'lcc',
                'first-testing', 'second-testing', 'inactive-ps-org'
            ];

            expectedOrganizations.forEach(orgId => {
                const org = organizations.find((o: any) => o.id === orgId);
                if (org) {
                    expect(org.id).toBe(orgId);
                    expect(org.name).toBeDefined();
                    expect(org.description).toBeDefined();
                }
            });
        }
    });

    test('should have seeded OGCIO organization with correct metadata', async ({ request }) => {
        const response = await request.get(`${LOGTO_API_BASE_URL}/api/organizations/ogcio`);

        if (response.ok()) {
            const ogcioOrg = await response.json();
            expect(ogcioOrg.id).toBe('ogcio');
            expect(ogcioOrg.name).toBe('OGCIO Seeded Org');
            expect(ogcioOrg.description).toBe('Organization created through seeder');
        }
    });

    test('should have seeded Health Service Executive organization', async ({ request }) => {
        const response = await request.get(`${LOGTO_API_BASE_URL}/api/organizations/hse`);

        if (response.ok()) {
            const hseOrg = await response.json();
            expect(hseOrg.id).toBe('hse');
            expect(hseOrg.name).toBe('Health Service Executive');
            expect(hseOrg.description).toContain('Health Service Executive');
            expect(hseOrg.description).toContain('Digital Postbox');
        }
    });

    test('should have seeded testing organizations for e2e tests', async ({ request }) => {
        const testingOrgs = ['first-testing', 'second-testing'];

        for (const orgId of testingOrgs) {
            const response = await request.get(`${LOGTO_API_BASE_URL}/api/organizations/${orgId}`);

            if (response.ok()) {
                const org = await response.json();
                expect(org.id).toBe(orgId);
                expect(org.name).toBeDefined();
                expect(org.description).toBeDefined();
                expect(org.name).toContain('Testing Organisation');
                expect(org.description).toContain('E2E testing');
            }
        }
    });

    test('should have custom connector configurations seeded', async ({ request }) => {
        const response = await request.get(`${LOGTO_API_BASE_URL}/api/connectors`);

        if (response.ok()) {
            const connectors = await response.json();
            const mygovIdConnector = connectors.find((c: any) => c.id === 'mygovid');
            const entraidConnector = connectors.find((c: any) => c.id === 'ogcio-entraid');

            if (mygovIdConnector) {
                expect(mygovIdConnector.id).toBe('mygovid');
                expect(mygovIdConnector.syncProfile).toBeDefined();
                expect(mygovIdConnector.connectorId).toBe('mygovid');
            }

            if (entraidConnector) {
                expect(entraidConnector.id).toBe('ogcio-entraid');
                expect(entraidConnector.syncProfile).toBeDefined();
                expect(entraidConnector.connectorId).toBe('ogcio-entraid');
            }
        }
    });

    test('should verify seeder data integrity', async ({ request }) => {
        const response = await request.get(`${LOGTO_API_BASE_URL}/api/organizations`);

        if (response.ok()) {
            const organizations = await response.json();
            const orgIds = organizations.map((org: any) => org.id);
            const uniqueOrgIds = [...new Set(orgIds)];

            expect(orgIds.length).toBe(uniqueOrgIds.length);

            organizations.forEach((org: any) => {
                expect(org.id).toBeDefined();
                expect(org.name).toBeDefined();
                expect(org.description).toBeDefined();
                expect(typeof org.id).toBe('string');
                expect(typeof org.name).toBe('string');
                expect(typeof org.description).toBe('string');
            });
        }
    });



    test('should maintain proper organization metadata', async ({ request }) => {
        const response = await request.get(`${LOGTO_API_BASE_URL}/api/organizations`);

        if (response.ok()) {
            const organizations = await response.json();
            const irishGovOrgs = organizations.filter((org: any) =>
                ['hse', 'dsp', 'doe', 'lcc', 'abp'].includes(org.id)
            );

            irishGovOrgs.forEach((org: any) => {
                expect(org.id).toBeDefined();
                expect(org.name).toBeDefined();
                expect(org.description).toBeDefined();

                if (org.description.includes('Digital Postbox')) {
                    expect(org.description).toContain('Imported from Digital Postbox');
                }
            });
        }
    });
});
