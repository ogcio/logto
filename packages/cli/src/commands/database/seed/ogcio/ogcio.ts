/* eslint-disable eslint-comments/disable-enable-pair */

import { defaultTenantId } from '@logto/schemas';
import type { CommonQueryMethods, DatabaseTransactionConnection } from 'slonik';

import { createOrganization } from './organizations.js';
import { seedRbacData } from './rbac.js';

const transactionMethod = async (transaction: DatabaseTransactionConnection) => {
  const organizationId = await createOrganization(transaction, defaultTenantId);
  const rbac = await seedRbacData(transaction, defaultTenantId);
};

export const seedOgcio = async (connection: CommonQueryMethods) => {
  await connection.transaction(transactionMethod);
};
