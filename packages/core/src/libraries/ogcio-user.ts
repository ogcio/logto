import { consoleLog } from '@logto/cli/lib/utils.js';
import phrases from '@logto/phrases';
import {
  type CreateUsersRole,
  type Role,
  type User,
  type Organization,
  adminTenantId,
} from '@logto/schemas';
import { generateStandardId } from '@logto/shared';
import { type QueryResult, type QueryResultRow } from '@silverhand/slonik';

import type OrganizationQueries from '#src/queries/organization/index.js';

import {
  OGCIO_ENTRA_ID_ENTITY,
  OGCIO_MY_GOV_ID_IDENTITY,
  OGCIO_ORGANIZATION_ROLES,
  OGCIO_ORGANIZATIONS,
  OGCIO_ROLES,
} from './ogcio-constants.js';

const assignCitizenRole = async (
  user: User,
  getRoles: (id: string) => Promise<Role>,
  insertUsersRoles: (
    usersRoles: CreateUsersRole[]
  ) => Promise<QueryResult<QueryResultRow> | undefined>
) => {
  const userRole = await getRoles(OGCIO_ROLES.BB_CITIZEN);

  return insertUsersRoles([
    {
      tenantId: user.tenantId,
      id: generateStandardId(),
      userId: user.id,
      roleId: userRole.id,
    },
  ]);
};

const assignUserToOrganization = async (user: User, organizationQueries: OrganizationQueries) => {
  try {
    const organization = await organizationQueries.findById(OGCIO_ORGANIZATIONS.INACTIVE_PS);
    await organizationQueries.relations.users.insert({
      organizationId: organization.id,
      userId: user.id,
    });
    return organization;
  } catch {
    consoleLog.error(phrases.en.errors.entity.not_exists_with_id);
  }
};

const assignOrganizationRoleToUser = async (
  user: User,
  organization: Organization,
  organizationQueries: OrganizationQueries
) => {
  const publicServantRole = await organizationQueries.roles.findById(
    OGCIO_ORGANIZATION_ROLES.INACTIVE_PUBLIC_SERVANT
  );

  await organizationQueries.relations.usersRoles.insert({
    organizationId: organization.id,
    organizationRoleId: publicServantRole.id,
    userId: user.id,
  });
};

const assignInactivePublicServantRole = async (
  user: User,
  organizationQueries: OrganizationQueries
) => {
  const organization = await assignUserToOrganization(user, organizationQueries);

  if (!organization) {
    return;
  }

  await assignOrganizationRoleToUser(user, organization, organizationQueries);
};

const getUserIdentities = (user: User) => {
  return Object.keys(user.identities);
};

export const manageDefaultUserRole = async (
  user: User,
  getRoles: (id: string) => Promise<Role>,
  insertUsersRoles: (
    usersRoles: CreateUsersRole[]
  ) => Promise<QueryResult<QueryResultRow> | undefined>,
  organizationQueries: OrganizationQueries
) => {
  if (user.tenantId === adminTenantId) {
    return;
  }

  const identities = getUserIdentities(user);

  if (identities.includes(OGCIO_ENTRA_ID_ENTITY)) {
    return assignInactivePublicServantRole(user, organizationQueries);
  }
  if (identities.includes(OGCIO_MY_GOV_ID_IDENTITY)) {
    return assignCitizenRole(user, getRoles, insertUsersRoles);
  }
};
