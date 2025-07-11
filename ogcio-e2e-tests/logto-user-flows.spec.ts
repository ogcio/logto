import { expect, test } from '@playwright/test';
import {
    assignRolesToUserViaApi,
    createUserViaApi,
    deleteUserViaApi,
    getRolesViaApi,
    callManagementApi,
} from './helpers/api-helpers';

// this file is to test custom ogcio user flows and data
// such as creating users, assigning roles, and deleting users

const LOGTO_ADMIN_URL = process.env.LOGTO_ADMIN_URL || 'http://localhost:3302';

test.describe('OGCIO E2E Tests - Custom OGCIO Functionality Only', () => {

    // No UI login needed - all tests are API-only
    test.beforeEach(async () => {
        console.log('🎯 Running OGCIO-specific tests - testing custom OGCIO functionality only');
        console.log('⚠️ These tests will FAIL if OGCIO seeding has not been properly executed');
    });

    test('OGCIO user management: create user, assign OGCIO roles, and delete user', async () => {
        // This test specifically validates OGCIO role assignment functionality
        const username = `ogcio-test-user-${Date.now()}`;

        console.log('👤 Testing OGCIO user management with OGCIO-specific roles...');
        console.log('Creating user via API...');
        const user = await createUserViaApi('ogcio-test@test.com', null, username, 'OGCIO test user');

        // Get available roles
        const roles = await getRolesViaApi();
        console.log(`📋 Found ${roles.length} total roles available`);

        // REQUIREMENT: Test OGCIO-specific role assignment
        const ogcioTargetRoles = roles.filter((role: any) =>
            ['Onboarded citizen', 'Citizen', 'FormsIE Admin'].includes(role.name)
        );

        console.log(`🎯 Found ${ogcioTargetRoles.length} OGCIO target roles:`, ogcioTargetRoles.map((r: any) => r.name));

        // REQUIREMENT: OGCIO roles must exist for testing
        expect(ogcioTargetRoles.length).toBeGreaterThan(0);

        // Assign OGCIO roles via API
        console.log('Assigning OGCIO roles via API...');
        await assignRolesToUserViaApi(user.id, ogcioTargetRoles.map((role: any) => role.id));

        // Verify OGCIO roles were assigned
        const userRoles = await callManagementApi(`/users/${user.id}/roles`);
        expect(Array.isArray(userRoles)).toBe(true);
        expect(userRoles.length).toBeGreaterThanOrEqual(ogcioTargetRoles.length);

        // Verify specific OGCIO roles were assigned
        for (const targetRole of ogcioTargetRoles) {
            const assignedRole = userRoles.find((role: any) => role.id === targetRole.id);
            expect(assignedRole).toBeDefined();
            console.log(`✅ OGCIO role "${targetRole.name}" successfully assigned`);
        }

        // Remove OGCIO roles via API
        console.log('Removing OGCIO roles via API...');
        for (const targetRole of ogcioTargetRoles) {
            await callManagementApi(`/users/${user.id}/roles/${targetRole.id}`, {
                method: 'DELETE',
            });
        }

        // Verify OGCIO roles were removed
        const userRolesAfterRemoval = await callManagementApi(`/users/${user.id}/roles`);
        for (const targetRole of ogcioTargetRoles) {
            const removedRole = userRolesAfterRemoval.find((role: any) => role.id === targetRole.id);
            expect(removedRole).toBeUndefined();
            console.log(`✅ OGCIO role "${targetRole.name}" successfully removed`);
        }

        // Clean up - delete the user
        await deleteUserViaApi(user.id);
        console.log('✅ OGCIO user management test completed successfully');
    });

    test('OGCIO custom connectors must be configured', async () => {
        // This test specifically checks for OGCIO custom connectors - not standard Logto ones
        const connectors = await callManagementApi('/connectors');
        expect(Array.isArray(connectors)).toBe(true);

        console.log('� Checking for OGCIO-specific connectors...');
        console.log('�📋 Available connectors:', connectors.map((c: any) => ({
            id: c.id,
            connectorId: c.connectorId,
            metadata: c.metadata?.name || 'No name'
        })));

        // REQUIREMENT: MyGovId connector must exist (OGCIO-specific)
        const myGovIdConnector = connectors.find((connector: any) =>
            connector.connectorId?.includes('mygovid') || connector.id?.includes('mygovid')
        );
        expect(myGovIdConnector).toBeDefined();
        console.log('✅ OGCIO MyGovId connector found');

        // REQUIREMENT: OGCIO EntraID connector must exist (OGCIO-specific)  
        const entraidConnector = connectors.find((connector: any) =>
            connector.connectorId?.includes('entraid') || connector.id?.includes('entraid') ||
            connector.connectorId?.includes('azuread') || connector.id?.includes('azuread')
        );
        expect(entraidConnector).toBeDefined();
        console.log('✅ OGCIO EntraID connector found');

        console.log('✅ All required OGCIO connectors are properly configured');
    });

    test('OGCIO branding must be correctly configured', async () => {
        // This test checks OGCIO-specific branding requirements
        const signInExperience = await callManagementApi('/sign-in-exp');

        console.log('🎨 Checking OGCIO-specific branding configuration...');
        console.log('📋 Current branding config:', {
            primaryColor: signInExperience.color?.primaryColor,
            darkPrimaryColor: signInExperience.color?.darkPrimaryColor,
            logoUrl: signInExperience.branding?.logoUrl,
            termsOfUseUrl: signInExperience.termsOfUseUrl,
            privacyPolicyUrl: signInExperience.privacyPolicyUrl
        });

        // REQUIREMENT: OGCIO primary color must be #004d44 (not default Logto purple)
        const expectedColor = '#004d44';
        const actualColor = signInExperience.color?.primaryColor;
        expect(actualColor).toBe(expectedColor);
        console.log('✅ OGCIO primary color is correctly set');

        // REQUIREMENT: OGCIO company logo must be configured
        expect(signInExperience.branding?.logoUrl).toBeTruthy();
        console.log('✅ OGCIO company logo URL is configured');

        // REQUIREMENT: OGCIO terms of use URL must contain '/terms-of-use'
        expect(signInExperience.termsOfUseUrl).toContain('/terms-of-use');
        console.log('✅ OGCIO terms of use URL is correctly configured');

        // REQUIREMENT: OGCIO privacy policy URL must contain '/privacy-policy'
        expect(signInExperience.privacyPolicyUrl).toContain('/privacy-policy');
        console.log('✅ OGCIO privacy policy URL is correctly configured');

        // REQUIREMENT: OGCIO password policy minimum length should be 8 (if configured)
        if (signInExperience.passwordPolicy?.length?.min) {
            expect(signInExperience.passwordPolicy.length.min).toBe(8);
            console.log('✅ OGCIO password policy is correctly configured');
        } else {
            console.log('ℹ️ OGCIO password policy not found in sign-in experience (may be set via other configuration)');
        }

        console.log('✅ All OGCIO branding requirements are properly configured');
    });

    test('OGCIO applications must be seeded (29 total)', async () => {
        // This test checks for the exact OGCIO application count from seeding
        const applications = await callManagementApi('/applications');
        expect(Array.isArray(applications)).toBe(true);

        console.log('🏢 Checking OGCIO application seeding...');
        console.log(`📋 Found ${applications.length} applications (OGCIO requirement: 29)`);
        console.log('Application names:', applications.map((app: any) => app.name || app.id).slice(0, 10));

        // REQUIREMENT: OGCIO seeding must create exactly 29 applications
        expect(applications.length).toBe(29);
        console.log('✅ OGCIO application seeding completed successfully - 29 applications found');
    });

    test('OGCIO roles must be seeded and available', async () => {
        // This test checks for OGCIO-specific roles only
        const roles = await getRolesViaApi();
        expect(Array.isArray(roles)).toBe(true);

        console.log('👥 Checking OGCIO-specific roles...');
        console.log(`📋 Found ${roles.length} total roles`);

        // REQUIREMENT: These specific OGCIO roles must exist
        const requiredOGCIORoles = [
            'Citizen',
            'FormsIE Admin', 
            'Onboarded citizen',
            'M2M Citizen Profile Reader role',
            'M2M Public Servant Profile role',
            'M2M E2E Messaging Citizen',
            'M2M Messaging Public Servant',
            'M2M Onboarding',
            'M2M E2E Profile Citizen',
            'M2M Citizen Journey Reader role',
            'M2M Public Servant Journey Reader role'
        ];

        for (const requiredRole of requiredOGCIORoles) {
            const role = roles.find((r: any) => r.name === requiredRole);
            expect(role).toBeDefined();
            console.log(`✅ OGCIO role "${requiredRole}" found`);
        }

        console.log('✅ All required OGCIO roles are properly seeded');
    });

    test('OGCIO organizations must be seeded', async () => {
        // This test checks for OGCIO-specific organizations only
        const organizations = await callManagementApi('/organizations');
        expect(Array.isArray(organizations)).toBe(true);

        console.log('🏛️ Checking OGCIO-specific organizations...');
        console.log(`📋 Found ${organizations.length} organizations`);

        // REQUIREMENT: These specific OGCIO organizations must exist
        const requiredOGCIOOrgs = [
            'OGCIO Seeded Org',
            'An Bord Pleanála',
            'Inactive Public Servants Org',
            'First Testing Organisation',
            'Second Testing Organisation',
            'Health Service Executive',
            'Department of Social Protection',
            'Dept. of Education/An Roinn Oideachais',
            'Limerick City and County Council',
            'Messaging Test'
        ];

        for (const requiredOrg of requiredOGCIOOrgs) {
            const org = organizations.find((o: any) => o.name === requiredOrg);
            expect(org).toBeDefined();
            console.log(`✅ OGCIO organization "${requiredOrg}" found`);
        }

        console.log('✅ All required OGCIO organizations are properly seeded');
    });

    test('OGCIO API resources (building blocks) must be seeded', async () => {
        // This test checks for OGCIO building block API resources only
        const apiResources = await callManagementApi('/resources');
        expect(Array.isArray(apiResources)).toBe(true);

        console.log('🔧 Checking OGCIO building block API resources...');
        console.log(`📋 Found ${apiResources.length} API resources`);

        // REQUIREMENT: These specific OGCIO building block API resources must exist
        const requiredOGCIOResources = [
            'Payments Building Block API',
            'Messaging Building Block API', 
            'Scheduler Building Block API',
            'Profile Building Block API',
            'File Upload Service API',
            'Journey Building Block API',
            'Analytics Building Block API',
            'Observability Open Telemetry Collector HTTP',
            'Observability Open Telemetry Collector GRPC',
            'Observability Dashboard Application',
            'FormsIE Submissions API'
        ];

        for (const requiredResource of requiredOGCIOResources) {
            const resource = apiResources.find((r: any) => r.name === requiredResource);
            expect(resource).toBeDefined();
            console.log(`✅ OGCIO API resource "${requiredResource}" found`);
        }

        console.log('✅ All required OGCIO building block API resources are properly seeded');
    });
});
