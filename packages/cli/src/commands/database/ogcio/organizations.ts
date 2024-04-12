/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable @silverhand/fp/no-mutating-methods */
import { type DatabaseTransactionConnection, sql } from '@silverhand/slonik';

import { type OrganizationSeeder } from './ogcio-seeder.js';
import { createItem } from './queries.js';

export const createOrganization = async (
  transaction: DatabaseTransactionConnection,
  tenantId: string
) => {
  const toInsert = { name: 'OGCIO Seeded Org', description: 'Organization created through seeder' };
  return createItem({
    transaction,
    tenantId,
    toInsert,
    whereClauses: [sql`name = ${toInsert.name}`],
    toLogFieldName: 'name',
    tableName: 'organizations',
    itemTypeName: 'Organization',
  });
};

type OrganizationSeederWithId = { id: string } & OrganizationSeeder;

export const createOrganizations = async (
  transaction: DatabaseTransactionConnection,
  tenantId: string,
  organizations: OrganizationSeeder[]
): Promise<OrganizationSeederWithId[]> => {
  const promises: Array<Promise<OrganizationSeederWithId>> = [];
  for (const organization of organizations) {
    promises.push(
      createItem({
        transaction,
        tenantId,
        toInsert: organization,
        whereClauses: [sql`name = ${organization.name}`],
        toLogFieldName: 'name',
        tableName: 'organizations',
        itemTypeName: 'Organization',
      })
    );
  }

  return Promise.all(promises);
};
