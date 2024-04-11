/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @silverhand/fp/no-mutating-methods */

import { defaultTenantId } from '@logto/schemas';
import type { CommonQueryMethods, DatabaseTransactionConnection } from '@silverhand/slonik';

import { seedApplications } from './applications.js';
import { getTenantSeederData, type OgcioSeeder } from './ogcio-seeder.js';
import { seedOrganizationRbacData } from './organizations-rbac.js';
import { createOrganizations } from './organizations.js';
import { seedResourceRbacData } from './resources-rbac.js';
import { seedResources } from './resources.js';

const createDataForTenant = async (
  transaction: DatabaseTransactionConnection,
  tenantId: string,
  tenantData: OgcioSeeder
) => {
  const organizations = await createOrganizations(transaction, tenantId, tenantData.organizations);
};

const transactionMethod = async (transaction: DatabaseTransactionConnection) => {
  const seedData = getTenantSeederData();
  const items: Array<Promise<void>> = [];
  for (const tenantId of Object.keys(seedData)) {
    items.push(createDataForTenant(transaction, tenantId, seedData[tenantId]!));
  }
  const organizationId = await createOrganization(transaction, defaultTenantId);
  const organizationRbac = await seedOrganizationRbacData(transaction, defaultTenantId);
  const applications = await seedApplications(transaction, defaultTenantId, {
    appRedirectUri: inputOgcioParams.appRedirectUri,
    appLogoutRedirectUri: inputOgcioParams.appLogoutRedirectUri,
  });
  const resources = await seedResources(
    transaction,
    defaultTenantId,
    inputOgcioParams.apiIndicator
  );
  const resourcesRbac = await seedResourceRbacData(transaction, defaultTenantId, resources);
};

export const seedOgcio = async (connection: CommonQueryMethods) => {
  await connection.transaction(transactionMethod);
};
