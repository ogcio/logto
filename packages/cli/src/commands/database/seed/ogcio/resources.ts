/* eslint-disable eslint-comments/disable-enable-pair */

/* eslint-disable @silverhand/fp/no-mutating-methods */
/* eslint-disable @silverhand/fp/no-mutation */
import { sql, type DatabaseTransactionConnection } from 'slonik';

import { createItem } from './queries.js';

const createResource = async (
  transaction: DatabaseTransactionConnection,
  tenantId: string,
  appToSeed: SeedingResource
) =>
  createItem({
    transaction,
    tenantId,
    toInsert: appToSeed,
    toLogFieldName: 'name',
    itemTypeName: 'Resource',
    whereClauses: [sql`indicator = ${appToSeed.indicator}`],
    tableName: 'resources',
  });

const setResourceId = async (
  element: SeedingResource,
  transaction: DatabaseTransactionConnection,
  tenantId: string
) => {
  element = await createResource(transaction, tenantId, element);
};

const createResources = async (
  transaction: DatabaseTransactionConnection,
  tenantId: string
): Promise<Record<string, SeedingResource>> => {
  const appsToCreate = { payments: fillPaymentsResource() };
  const queries: Array<Promise<void>> = [];
  for (const element of Object.values(appsToCreate)) {
    queries.push(setResourceId(element, transaction, tenantId));
  }

  await Promise.all(queries);

  return appsToCreate;
};

type SeedingResource = {
  name: string;
  indicator: string;
  is_default?: boolean;
  access_token_ttl?: number;
};

const fillPaymentsResource = (): SeedingResource => ({
  name: 'Life Events Payments API',
  indicator: 'http://localhost:8001',
  is_default: false,
  access_token_ttl: 3600,
});

export const seedResources = async (transaction: DatabaseTransactionConnection, tenantId: string) =>
  createResources(transaction, tenantId);
