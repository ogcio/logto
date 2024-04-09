import { type Organization } from '@logto/schemas';
import { generateStandardId } from '@logto/shared';
import { type DatabaseTransactionConnection, type QueryResult, sql } from 'slonik';

import { insertInto } from '../../../../database.js';
import { consoleLog } from '../../../../utils.js';

const getIdByQueryResult = <T extends { id: string }>(
  result: QueryResult<T>
): string | undefined => {
  if (result.rows[0] === undefined) {
    return undefined;
  }

  return result.rows[0].id;
};

const getOrganizationId = async (
  transaction: DatabaseTransactionConnection,
  tenantId: string,
  organizationName: string
): Promise<string | undefined> => {
  const organization = await transaction.query<Organization>(sql`
    select id from organizations
      where tenant_id = ${tenantId}
      and name = ${organizationName}
      limit 1
  `);

  return getIdByQueryResult(organization);
};

export const createOrganization = async (
  transaction: DatabaseTransactionConnection,
  tenantId: string
) => {
  const name = 'OGCIO Seeded Org';
  consoleLog.info(`Creating organization. TenantId: ${tenantId}. Name: ${name}`);
  const orgIdBefore = await getOrganizationId(transaction, tenantId, name);
  if (orgIdBefore !== undefined) {
    consoleLog.info(`Creating organization. TenantId: ${tenantId}. Name: ${name}. Already exists`);
    return orgIdBefore;
  }
  const organizationData = {
    id: generateStandardId(),
    tenant_id: tenantId,
    name: 'OGCIO Seeded Org',
    description: 'Organization created through seeder',
  };

  await transaction.query(insertInto(organizationData, 'organizations'));

  const orgIdAfter = await getOrganizationId(transaction, tenantId, name);
  if (orgIdAfter !== undefined) {
    consoleLog.info(
      `Creating organization. TenantId: ${tenantId}. Name: ${name}. Created, Id: ${orgIdAfter}`
    );
    return orgIdAfter;
  }

  throw new Error(
    `OGCIO seeding. Failure inserting organization with tenant id ${tenantId} and name ${name}`
  );
};
