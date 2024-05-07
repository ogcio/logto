import type {
  User,
  CreateUser,
  Scope,
  BindMfa,
  MfaVerification,
  Organization,
  OrganizationRole,
} from '@logto/schemas';
import { MfaFactor, Users, UsersPasswordEncryptionMethod } from '@logto/schemas';
import { generateStandardShortId, generateStandardId } from '@logto/shared';
import type { Nullable } from '@silverhand/essentials';
import { deduplicate } from '@silverhand/essentials';
import { type DatabaseTransactionConnection } from '@silverhand/slonik';
import { argon2Verify, bcryptVerify, md5, sha1, sha256 } from 'hash-wasm';
import pRetry from 'p-retry';

import { buildInsertIntoWithPool } from '#src/database/insert-into.js';
import { EnvSet } from '#src/env-set/index.js';
import RequestError from '#src/errors/RequestError/index.js';
import OrganizationQueries from '#src/queries/organization/index.js';
import { createUsersRolesQueries } from '#src/queries/users-roles.js';
import type Queries from '#src/tenants/Queries.js';
import assertThat from '#src/utils/assert-that.js';
import { encryptPassword } from '#src/utils/password.js';
import type { OmitAutoSetFields } from '#src/utils/sql.js';

export const encryptUserPassword = async (
  password: string
): Promise<{
  passwordEncrypted: string;
  passwordEncryptionMethod: UsersPasswordEncryptionMethod;
}> => {
  const passwordEncryptionMethod = UsersPasswordEncryptionMethod.Argon2i;
  const passwordEncrypted = await encryptPassword(password, passwordEncryptionMethod);

  return { passwordEncrypted, passwordEncryptionMethod };
};

/**
 * Convert bindMfa to mfaVerification, add common fields like "id" and "createdAt"
 * and transpile formats like "codes" to "code" for backup code
 */
const converBindMfaToMfaVerification = (bindMfa: BindMfa): MfaVerification => {
  const { type } = bindMfa;
  const base = {
    id: generateStandardId(),
    createdAt: new Date().toISOString(),
  };

  if (type === MfaFactor.BackupCode) {
    const { codes } = bindMfa;

    return {
      ...base,
      type,
      codes: codes.map((code) => ({ code })),
    };
  }

  if (type === MfaFactor.TOTP) {
    const { secret } = bindMfa;

    return {
      ...base,
      type,
      key: secret,
    };
  }

  const { credentialId, counter, publicKey, transports, agent } = bindMfa;
  return {
    ...base,
    type,
    credentialId,
    counter,
    publicKey,
    transports,
    agent,
  };
};

export type UserLibrary = ReturnType<typeof createUserLibrary>;

export const createUserLibrary = (queries: Queries) => {
  const {
    pool,
    roles: { findRolesByRoleNames, findRoleByRoleName, findRolesByRoleIds },
    users: {
      hasUser,
      hasUserWithEmail,
      hasUserWithId,
      hasUserWithPhone,
      findUsersByIds,
      updateUserById,
      findUserById,
    },
    usersRoles: { findUsersRolesByRoleId, findUsersRolesByUserId },
    rolesScopes: { findRolesScopesByRoleIds },
    scopes: { findScopesByIdsAndResourceIndicator },
  } = queries;

  const generateUserId = async (retries = 500) =>
    pRetry(
      async () => {
        const id = generateStandardShortId();

        if (!(await hasUserWithId(id))) {
          return id;
        }

        throw new Error('Cannot generate user ID in reasonable retries');
      },
      { retries, factor: 0 } // No need for exponential backoff
    );

  const insertUser = async (data: OmitAutoSetFields<CreateUser>, additionalRoleNames: string[]) => {
    const roleNames = deduplicate([...EnvSet.values.userDefaultRoleNames, ...additionalRoleNames]);
    const roles = await findRolesByRoleNames(roleNames);

    assertThat(roles.length === roleNames.length, 'role.default_role_missing');

    const orgRelations = await getOrganizationRelationsForUser();

    return pool.transaction(async (connection) => {
      const insertUserQuery = buildInsertIntoWithPool(connection)(Users, {
        returning: true,
      });

      const user = await insertUserQuery(data);

      if (roles.length > 0) {
        const { insertUsersRoles } = createUsersRolesQueries(connection);
        await insertUsersRoles(
          roles.map(({ id }) => ({ id: generateStandardId(), userId: user.id, roleId: id }))
        );
      }

      await insertOrganizationRelationsForUser({ userId: user.id, connection, ...orgRelations });

      return user;
    });
  };

  const checkIdentifierCollision = async (
    identifiers: {
      username?: Nullable<string>;
      primaryEmail?: Nullable<string>;
      primaryPhone?: Nullable<string>;
    },
    excludeUserId?: string
  ) => {
    const { primaryEmail, primaryPhone, username } = identifiers;

    if (primaryEmail && (await hasUserWithEmail(primaryEmail, excludeUserId))) {
      throw new RequestError({ code: 'user.email_already_in_use', status: 422 });
    }

    if (primaryPhone && (await hasUserWithPhone(primaryPhone, excludeUserId))) {
      throw new RequestError({ code: 'user.phone_already_in_use', status: 422 });
    }

    if (username && (await hasUser(username, excludeUserId))) {
      throw new RequestError({ code: 'user.username_already_in_use', status: 422 });
    }
  };

  const findUsersByRoleName = async (roleName: string) => {
    const role = await findRoleByRoleName(roleName);

    if (!role) {
      return [];
    }

    const usersRoles = await findUsersRolesByRoleId(role.id);

    if (usersRoles.length === 0) {
      return [];
    }

    return findUsersByIds(usersRoles.map(({ userId }) => userId));
  };

  const findUserScopesForResourceIndicator = async (
    userId: string,
    resourceIndicator: string
  ): Promise<readonly Scope[]> => {
    const usersRoles = await findUsersRolesByUserId(userId);
    const rolesScopes = await findRolesScopesByRoleIds(usersRoles.map(({ roleId }) => roleId));

    const scopes = await findScopesByIdsAndResourceIndicator(
      rolesScopes.map(({ scopeId }) => scopeId),
      resourceIndicator
    );

    return scopes;
  };

  const findUserRoles = async (userId: string) => {
    const usersRoles = await findUsersRolesByUserId(userId);
    const roles = await findRolesByRoleIds(usersRoles.map(({ roleId }) => roleId));

    return roles;
  };

  const addUserMfaVerification = async (userId: string, payload: BindMfa) => {
    // TODO @sijie use jsonb array append
    const { mfaVerifications } = await findUserById(userId);
    await updateUserById(userId, {
      mfaVerifications: [...mfaVerifications, converBindMfaToMfaVerification(payload)],
    });
  };

  const verifyUserPassword = async (user: Nullable<User>, password: string): Promise<User> => {
    assertThat(user, new RequestError({ code: 'session.invalid_credentials', status: 422 }));
    const { passwordEncrypted, passwordEncryptionMethod, id } = user;

    assertThat(
      passwordEncrypted && passwordEncryptionMethod,
      new RequestError({ code: 'session.invalid_credentials', status: 422 })
    );

    switch (passwordEncryptionMethod) {
      case UsersPasswordEncryptionMethod.Argon2i: {
        const result = await argon2Verify({ password, hash: passwordEncrypted });
        assertThat(result, new RequestError({ code: 'session.invalid_credentials', status: 422 }));
        break;
      }
      case UsersPasswordEncryptionMethod.MD5: {
        const expectedEncrypted = await md5(password);
        assertThat(
          expectedEncrypted === passwordEncrypted,
          new RequestError({ code: 'session.invalid_credentials', status: 422 })
        );
        break;
      }
      case UsersPasswordEncryptionMethod.SHA1: {
        const expectedEncrypted = await sha1(password);
        assertThat(
          expectedEncrypted === passwordEncrypted,
          new RequestError({ code: 'session.invalid_credentials', status: 422 })
        );
        break;
      }
      case UsersPasswordEncryptionMethod.SHA256: {
        const expectedEncrypted = await sha256(password);
        assertThat(
          expectedEncrypted === passwordEncrypted,
          new RequestError({ code: 'session.invalid_credentials', status: 422 })
        );
        break;
      }
      case UsersPasswordEncryptionMethod.Bcrypt: {
        const result = await bcryptVerify({ password, hash: passwordEncrypted });
        assertThat(result, new RequestError({ code: 'session.invalid_credentials', status: 422 }));
        break;
      }
      default: {
        throw new RequestError({ code: 'session.invalid_credentials', status: 422 });
      }
    }

    // Migrate password to default algorithm: argon2i
    if (passwordEncryptionMethod !== UsersPasswordEncryptionMethod.Argon2i) {
      const { passwordEncrypted: newEncrypted, passwordEncryptionMethod: newMethod } =
        await encryptUserPassword(password);
      return updateUserById(id, {
        passwordEncrypted: newEncrypted,
        passwordEncryptionMethod: newMethod,
      });
    }

    return user;
  };

  // eslint-disable-next-line unicorn/consistent-function-scoping
  const getDefaultOrganizationsForUser = async (orgQueries: OrganizationQueries) => {
    const organizationNames = deduplicate(EnvSet.values.userDefaultOrganizationNames);
    if (organizationNames.length === 0) {
      return [];
    }
    const lowerOrganizationNames = new Set(organizationNames.map((name) => name.toLowerCase()));
    const allOrganizations = await orgQueries.findAll();

    const outputOrgs = allOrganizations[1].filter((fromDatabaseOrg: Organization) =>
      lowerOrganizationNames.has(fromDatabaseOrg.name.toLowerCase())
    );

    assertThat(outputOrgs.length === organizationNames.length, 'role.default_organization_missing');

    return outputOrgs;
  };

  // eslint-disable-next-line unicorn/consistent-function-scoping
  const getDefaultOrganizationRolesForUser = async (orgQueries: OrganizationQueries) => {
    const roleNames = deduplicate(EnvSet.values.userDefaultOrganizationRoleNames);
    if (roleNames.length === 0) {
      return [];
    }
    const lowerRoleNames = new Set(roleNames.map((name) => name.toLowerCase()));
    const limit = 200;
    const offset = 0;
    // eslint-disable-next-line @silverhand/fp/no-let
    let outputRoleNames: OrganizationRole[] = [];
    // eslint-disable-next-line @silverhand/fp/no-let
    let foundCount = 1;
    while (outputRoleNames.length < lowerRoleNames.size && foundCount > 0) {
      // eslint-disable-next-line no-await-in-loop
      const allOrganizations = await orgQueries.roles.findAll(limit, offset);
      // eslint-disable-next-line @silverhand/fp/no-mutation
      foundCount = allOrganizations[0];
      // eslint-disable-next-line @silverhand/fp/no-mutation
      outputRoleNames = [
        ...outputRoleNames,
        ...allOrganizations[1].filter((fromDatabaseOrg: OrganizationRole) =>
          lowerRoleNames.has(fromDatabaseOrg.name.toLowerCase())
        ),
      ];
    }

    assertThat(outputRoleNames.length === lowerRoleNames.size, 'role.default_organization_missing');

    return outputRoleNames;
  };

  const getOrganizationRelationsForUser = async () => {
    const orgQueries = new OrganizationQueries(pool);
    return {
      organizations: await getDefaultOrganizationsForUser(orgQueries),
      roles: await getDefaultOrganizationRolesForUser(orgQueries),
    };
  };

  const insertOrganizationRelationsForUser = async (params: {
    userId: string;
    connection: DatabaseTransactionConnection;
    organizations: Organization[];
    roles: OrganizationRole[];
  }) => {
    const orgQueries = new OrganizationQueries(pool);
    if (params.organizations.length === 0) {
      return;
    }

    const orgMappings = params.organizations.map((organization: Organization): [string, string] => [
      organization.id,
      params.userId,
    ]);

    await Promise.all(orgMappings.map(async (org) => orgQueries.relations.users.insert(org)));

    if (params.roles.length > 0) {
      // Org id, role id, user id
      const rolesMappings: Array<[string, string, string]> = [];
      for (const role of params.roles) {
        for (const orgMap of orgMappings) {
          // eslint-disable-next-line @silverhand/fp/no-mutating-methods
          rolesMappings.push([orgMap[0], role.id, orgMap[1]]);
        }
      }

      await Promise.all(
        rolesMappings.map(async (roleMap) => orgQueries.relations.rolesUsers.insert(roleMap))
      );
    }
  };
};
