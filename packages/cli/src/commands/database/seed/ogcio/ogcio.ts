/* eslint-disable eslint-comments/disable-enable-pair */

import { defaultTenantId } from '@logto/schemas';
import type { CommonQueryMethods, DatabaseTransactionConnection } from 'slonik';

import { seedApplications } from './applications.js';
import { seedOrganizationRbacData } from './organizations-rbac.js';
import { createOrganization } from './organizations.js';

const transactionMethod = async (transaction: DatabaseTransactionConnection) => {
  const organizationId = await createOrganization(transaction, defaultTenantId);
  const rbac = await seedOrganizationRbacData(transaction, defaultTenantId);
  const applications = await seedApplications(transaction, defaultTenantId);
};

export const seedOgcio = async (connection: CommonQueryMethods) => {
  await connection.transaction(transactionMethod);
};
