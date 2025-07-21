/* eslint-disable eslint-comments/disable-enable-pair */

import { LogtoConfigs, LogtoJwtTokenKey } from '@logto/schemas';
import { sql, type DatabaseTransactionConnection } from '@silverhand/slonik';

import { type CustomJWTSeeder } from './ogcio-seeder.js';
import { createOrUpdateItemWithoutId } from './queries.js';

type CustomJWTClaim = {
  key: string;
  value: string;
};

const createCustomJWTClaim = async (
  transaction: DatabaseTransactionConnection,
  tenantId: string,
  experienceToSeed: CustomJWTClaim
) => {
  return createOrUpdateItemWithoutId({
    transaction,
    tenantId,
    toInsert: experienceToSeed,
    toLogFieldName: 'value',
    whereClauses: [sql`tenant_id = ${tenantId}`, sql`key = ${experienceToSeed.key}`],
    tableName: LogtoConfigs.table,
    columnToGet: 'value',
  });
};

const fillCustomJWT = (inputExperiences: CustomJWTSeeder): CustomJWTClaim => {
  return {
    key: LogtoJwtTokenKey.AccessToken,
    value: JSON.stringify(inputExperiences),
  };
};

export const seedCustomJWT = async (params: {
  transaction: DatabaseTransactionConnection;
  tenantId: string;
  customJWT: CustomJWTSeeder;
}) => {
  const customJWTToCreate = fillCustomJWT(params.customJWT);
  await createCustomJWTClaim(params.transaction, params.tenantId, customJWTToCreate);
  return customJWTToCreate;
};
