/* eslint-disable eslint-comments/disable-enable-pair */

import { defaultTenantId } from '@logto/schemas';
import type { CommonQueryMethods, DatabaseTransactionConnection } from 'slonik';

import { seedApplications } from './applications.js';
import { seedOrganizationRbacData } from './organizations-rbac.js';
import { createOrganization } from './organizations.js';
import { seedResourceRbacData } from './resources-rbac.js';
import { seedResources } from './resources.js';

const transactionMethod = async (transaction: DatabaseTransactionConnection) => {
  const organizationId = await createOrganization(transaction, defaultTenantId);
  const organizationRbac = await seedOrganizationRbacData(transaction, defaultTenantId);
  const applications = await seedApplications(transaction, defaultTenantId);
  const resources = await seedResources(transaction, defaultTenantId);
  const resourcesRbac = await seedResourceRbacData(transaction, defaultTenantId, resources);
};

export const seedOgcio = async (connection: CommonQueryMethods) => {
  await connection.transaction(transactionMethod);
};
