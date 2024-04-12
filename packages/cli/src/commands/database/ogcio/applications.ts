/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable @silverhand/fp/no-mutating-methods */
/* eslint-disable @silverhand/fp/no-mutation */
import { generateStandardSecret } from '@logto/shared';
import { sql, type DatabaseTransactionConnection } from '@silverhand/slonik';

import { type ApplicationSeeder } from './ogcio-seeder.js';
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
  tenantId: string,
  inputApplications: ApplicationSeeder[]
): Promise<Record<string, SeedingApplication>> => {
  const appsToCreate = fillApplications(inputApplications);
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

const fillApplications = (
  inputApplications: ApplicationSeeder[]
): Record<string, SeedingApplication> => {
  const outputValues: Record<string, SeedingApplication> = {};
  for (const inputApp of inputApplications) {
    outputValues[inputApp.name] = {
      name: inputApp.name,
      secret: generateStandardSecret(),
      description: inputApp.description,
      type: inputApp.type,
      oidc_client_metadata: `{"redirectUris": ["${inputApp.redirect_uri}"], "postLogoutRedirectUris": ["${inputApp.logout_redirect_uri}"]}`,
      custom_client_metadata:
        '{"idTokenTtl": 3600, "corsAllowedOrigins": [], "rotateRefreshToken": true, "refreshTokenTtlInDays": 14, "alwaysIssueRefreshToken": false}',
    };
  }

  return outputValues;
};

export const seedApplications = async (
  transaction: DatabaseTransactionConnection,
  tenantId: string,
  applications: ApplicationSeeder[]
) => createApplications(transaction, tenantId, applications);
