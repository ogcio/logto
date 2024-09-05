/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable @silverhand/fp/no-mutating-methods */

import { createHmac } from 'node:crypto';

import { Users, UsersRoles } from '@logto/schemas';
import { conditional } from '@silverhand/essentials';
import { sql, type DatabaseTransactionConnection } from '@silverhand/slonik';
import { got } from 'got';

import { consoleLog } from '../../../utils.js';

import { type UserSeeder } from './ogcio-seeder.js';
import { createOrUpdateItem } from './queries.js';
import { type SeedingWebhook } from './webhooks.js';

const MYGOVID_IDENTITY = 'MyGovId (MyGovId connector)';

export const seedUsers = async (params: {
  transaction: DatabaseTransactionConnection;
  tenantId: string;
  usersToSeed: UserSeeder[];
  webhook?: SeedingWebhook;
}) => {
  if (params.usersToSeed.length === 0) {
    return {};
  }

  const queries: Array<Promise<void>> = [];

  for (const user of params.usersToSeed) {
    queries.push(createUser({ ...params, userToSeed: user }));
  }

  await Promise.all(queries);

  return params.usersToSeed;
};

const createUser = async (params: {
  transaction: DatabaseTransactionConnection;
  tenantId: string;
  userToSeed: UserSeeder;
  webhook?: SeedingWebhook;
}): Promise<void> => {
  await createOrUpdateItem({
    transaction: params.transaction,
    tenantId: params.tenantId,
    toLogFieldName: 'id',
    whereClauses: [sql`tenant_id = ${params.tenantId}`, sql`id = ${params.userToSeed.id}`],
    toInsert: {
      id: params.userToSeed.id,
      username: params.userToSeed.username,
      primary_email: params.userToSeed.primary_email,
      primary_phone: params.userToSeed.primary_phone ?? undefined,
      name: params.userToSeed.name,
      application_id: params.userToSeed.application_id,
    },
    tableName: Users.table,
  });

  const assignRoleQueries = [];
  for (const roleId of params.userToSeed.resource_role_ids) {
    assignRoleQueries.push(
      createOrUpdateItem({
        transaction: params.transaction,
        tenantId: params.tenantId,
        toLogFieldName: 'role_id',
        whereClauses: [
          sql`tenant_id = ${params.tenantId}`,
          sql`user_id = ${params.userToSeed.id}`,
          sql`role_id = ${roleId}`,
        ],
        toInsert: {
          user_id: params.userToSeed.id,
          role_id: roleId,
        },
        tableName: UsersRoles.table,
      })
    );
  }

  await Promise.all(assignRoleQueries);

  if (params.webhook) {
    consoleLog.info(`Invoking webhook for user. User id: ${params.userToSeed.id}`);
    await sendWebhookRequest({ seededUser: params.userToSeed, webhook: params.webhook });
    consoleLog.info(`Webhook invoked for user. User id: ${params.userToSeed.id}`);
  }
};

export const sendWebhookRequest = async (params: {
  seededUser: UserSeeder;
  webhook: SeedingWebhook;
}) => {
  // eslint-disable-next-line no-restricted-syntax
  const config = JSON.parse(params.webhook.config) as { url: string };
  const payload = buildWebhookPayload(params.seededUser);
  return got.post(config.url, {
    headers: {
      'user-agent': 'Logto (https://logto.io/)',
      ...conditional(
        params.webhook.signing_key && {
          'logto-signature-sha-256': sign(params.webhook.signing_key, payload),
        }
      ),
    },
    json: payload,
    retry: { limit: 3 },
  });
};

const buildWebhookPayload = (user: UserSeeder) => {
  const names = user.name.split(' ');
  const lastName = names.pop();
  const firstName = names.join(' ');

  return {
    event: 'User.Created',
    data: {
      id: user.id,
      identities: {
        [MYGOVID_IDENTITY]: {
          details: {
            rawData: {
              firstName,
              lastName,
              PublicServiceNumber: user.ppsn,
              BirthDate: undefined,
            },
            email: user.primary_email,
            phone: user.primary_phone,
          },
        },
      },
    },
  };
};

const sign = (signingKey: string, payload: Record<string, unknown>) => {
  const hmac = createHmac('sha256', signingKey);
  const payloadString = JSON.stringify(payload);
  hmac.update(payloadString);
  return hmac.digest('hex');
};
