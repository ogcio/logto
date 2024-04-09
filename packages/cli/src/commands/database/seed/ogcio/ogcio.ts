/* eslint-disable eslint-comments/disable-enable-pair */

import { defaultTenantId } from '@logto/schemas';
import type { CommonQueryMethods, DatabaseTransactionConnection } from 'slonik';

import { seedOrganizationRbacData } from './organizations-rbac.js';

const transactionMethod = async (transaction: DatabaseTransactionConnection) => {
  // Const organizationId = await createOrganization(transaction, defaultTenantId);
  const organizationRbac = await seedOrganizationRbacData(transaction, defaultTenantId);
  // Const applications = await seedApplications(transaction, defaultTenantId);
  // const resources = await seedResources(transaction, defaultTenantId);
  // const resourcesRbac = await seedResourceRbacData(transaction, defaultTenantId, resources);
};

export const seedOgcio = async (connection: CommonQueryMethods) => {
  await connection.transaction(transactionMethod);
};
