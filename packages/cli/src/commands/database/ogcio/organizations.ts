/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable @silverhand/fp/no-mutating-methods */
/* eslint-disable @silverhand/fp/no-mutation */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import {
  type AdminConsoleData,
  LogtoTenantConfigKey,
  type CreateLogtoConfig,
  defaultTenantId,
  LogtoConfigs,
  Organizations,
} from '@logto/schemas';
import { type DatabaseTransactionConnection, sql } from '@silverhand/slonik';

import { insertInto } from '../../../database.js';
import { consoleLog } from '../../../utils.js';

import { type OrganizationSeeder } from './ogcio-seeder.js';
import { createItem, getInsertedColumnValue, updateQuery } from './queries.js';

type OrganizationSeederWithId = { id: string } & OrganizationSeeder;

const createAdminConsoleConfig = (
  forTenantId: string
): Readonly<{
  tenantId: string;
  key: LogtoTenantConfigKey;
  value: AdminConsoleData;
}> =>
  Object.freeze({
    tenantId: forTenantId,
    key: LogtoTenantConfigKey.AdminConsole,
    value: {
      signInExperienceCustomized: false,
      organizationCreated: true,
    },
  } satisfies CreateLogtoConfig);

const updateTenantConfigs = async (
  transaction: DatabaseTransactionConnection,
  tenantId: string
): Promise<void> => {
  consoleLog.info(`Updating ${LogtoConfigs.table} for tenant id ${tenantId}`);
  const currentValue = await getInsertedColumnValue({
    transaction,
    tenantId,
    whereClauses: [sql`key = ${LogtoTenantConfigKey.AdminConsole}`],
    tableName: LogtoConfigs.table,
    columnToGet: 'value',
  });

  if (currentValue === undefined) {
    await transaction.query(
      insertInto(createAdminConsoleConfig(defaultTenantId), LogtoConfigs.table)
    );
    return;
  }

  const jsonValue = typeof currentValue === 'string' ? JSON.parse(currentValue) : currentValue;
  jsonValue.organizationCreated = true;
  const updateQueryString = updateQuery(
    [sql`value = ${JSON.stringify(jsonValue)}`],
    [sql`key = ${LogtoTenantConfigKey.AdminConsole}`, sql`tenant_id = ${tenantId}`],
    LogtoConfigs.table
  );

  await transaction.query(updateQueryString);

  consoleLog.info(`Updated ${LogtoConfigs.table} for tenant id ${tenantId}`);
};

const createOrganization = async (params: {
  transaction: DatabaseTransactionConnection;
  tenantId: string;
  organizationSeeder: OrganizationSeeder;
}) => {
  const organization = createItem({
    transaction: params.transaction,
    tenantId: params.tenantId,
    toInsert: {
      name: params.organizationSeeder.name,
      description: params.organizationSeeder.description,
    },
    whereClauses: [sql`name = ${params.organizationSeeder.name}`],
    toLogFieldName: 'name',
    tableName: Organizations.table,
  });

  return organization;
};

export const createOrganizations = async (params: {
  transaction: DatabaseTransactionConnection;
  tenantId: string;
  organizations: OrganizationSeeder[];
}): Promise<OrganizationSeederWithId[]> => {
  const promises: Array<Promise<OrganizationSeederWithId>> = [];
  for (const organization of params.organizations) {
    promises.push(
      createOrganization({
        transaction: params.transaction,
        tenantId: params.tenantId,
        organizationSeeder: organization,
      })
    );
  }

  const organizationsCreated = Promise.all(promises);

  await updateTenantConfigs(params.transaction, params.tenantId);

  return organizationsCreated;
};
