/* eslint-disable eslint-comments/disable-enable-pair */

/* eslint-disable @silverhand/fp/no-mutating-methods */
/* eslint-disable @silverhand/fp/no-mutation */
import { ApplicationType } from '@logto/schemas';
import { generateStandardSecret } from '@logto/shared';
import { sql, type DatabaseTransactionConnection } from 'slonik';

import { createItem } from './queries.js';

const createApplication = async (
  transaction: DatabaseTransactionConnection,
  tenantId: string,
  appToSeed: SeedingApplication
) =>
  createItem({
    transaction,
    tenantId,
    toInsert: appToSeed,
    toLogFieldName: 'name',
    itemTypeName: 'Application',
    whereClauses: [sql`name = ${appToSeed.name}`],
    tableName: 'applications',
  });

const setApplicationId = async (
  element: SeedingApplication,
  transaction: DatabaseTransactionConnection,
  tenantId: string
) => {
  element = await createApplication(transaction, tenantId, element);
};

const createApplications = async (
  transaction: DatabaseTransactionConnection,
  tenantId: string
): Promise<Record<string, SeedingApplication>> => {
  const appsToCreate = { payments: fillPaymentsApplication() };
  const queries: Array<Promise<void>> = [];
  for (const element of Object.values(appsToCreate)) {
    queries.push(setApplicationId(element, transaction, tenantId));
  }

  await Promise.all(queries);

  return appsToCreate;
};

type SeedingApplication = {
  name: string;
  secret: string;
  description: string;
  type: string;
  oidc_client_metadata: string;
  custom_client_metadata: string;
  protected_app_metadata?: string;
  is_third_party?: boolean;
};

const fillPaymentsApplication = (): SeedingApplication => ({
  name: 'Life Events Payments App',
  secret: generateStandardSecret(),
  description: 'Payments App of Life Events',
  type: ApplicationType.Traditional,
  oidc_client_metadata:
    '{"redirectUris": ["http://localhost:3001/callback"], "postLogoutRedirectUris": ["http://localhost:3001/"]}',
  custom_client_metadata:
    '{"idTokenTtl": 3600, "corsAllowedOrigins": [], "rotateRefreshToken": true, "refreshTokenTtlInDays": 14, "alwaysIssueRefreshToken": false}',
});

export const seedApplications = async (
  transaction: DatabaseTransactionConnection,
  tenantId: string
) => createApplications(transaction, tenantId);
