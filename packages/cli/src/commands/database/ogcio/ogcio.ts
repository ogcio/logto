/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @silverhand/fp/no-mutating-methods */

import type { CommonQueryMethods, DatabaseTransactionConnection } from '@silverhand/slonik';

import { getTenantSeederData, type OgcioSeeder } from './ogcio-seeder.js';
import { seedOrganizationRbacData } from './organizations-rbac.js';
import { createOrganizations } from './organizations.js';

const createDataForTenant = async (
  transaction: DatabaseTransactionConnection,
  tenantId: string,
  tenantData: OgcioSeeder
) => {
  const organizations = await createOrganizations(transaction, tenantId, tenantData.organizations);
  const organizationsRbac = await seedOrganizationRbacData(transaction, tenantId, tenantData);
};

const transactionMethod = async (transaction: DatabaseTransactionConnection) => {
  const seedData = getTenantSeederData();
  const items: Array<Promise<void>> = [];
  for (const tenantId of Object.keys(seedData)) {
    items.push(createDataForTenant(transaction, tenantId, seedData[tenantId]!));
  }

  await Promise.all(items);

  // Const applications = await seedApplications(transaction, defaultTenantId, {
  //   appRedirectUri: inputOgcioParams.appRedirectUri,
  //   appLogoutRedirectUri: inputOgcioParams.appLogoutRedirectUri,
  // });
  // const resources = await seedResources(
  //   transaction,
  //   defaultTenantId,
  //   inputOgcioParams.apiIndicator
  // );
  // const resourcesRbac = await seedResourceRbacData(transaction, defaultTenantId, resources);
};

export const seedOgcio = async (connection: CommonQueryMethods) => {
  await connection.transaction(transactionMethod);
};
