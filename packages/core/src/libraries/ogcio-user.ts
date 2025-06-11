import phrases from '@logto/phrases';
import {
  type CreateUsersRole,
  type Role,
  type User,
  type Organization,
  adminTenantId,
  type UsersRole,
} from '@logto/schemas';
import { generateStandardId } from '@logto/shared';
import { type QueryResult, type QueryResultRow } from '@silverhand/slonik';

import type OrganizationQueries from '#src/queries/organization/index.js';

import { type WithHooksAndLogsContext } from '../routes/experience/types.js';
import { getConsoleLogFromContext } from '../utils/console.js';

import {
  OGCIO_ENTRA_ID_IDENTITY,
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
  ) => Promise<QueryResult<QueryResultRow> | undefined>,
  ctx: WithHooksAndLogsContext
) => {
  try {
    const userRole = await getRoles(OGCIO_ROLES.BB_CITIZEN);

    return await insertUsersRoles([
      {
        tenantId: user.tenantId,
        id: generateStandardId(),
        userId: user.id,
        roleId: userRole.id,
      },
    ]);
  } catch (error) {
    getConsoleLogFromContext(ctx).error(
      `OGCIO: User registration - Citizen role with ID ${OGCIO_ROLES.BB_CITIZEN} couldn't be assigned to the user`,
      error
    );
  }
};

const assignUserToOrganization = async (
  user: User,
  organizationQueries: OrganizationQueries,
  ctx: WithHooksAndLogsContext
) => {
  try {
    const organization = await organizationQueries.findById(OGCIO_ORGANIZATIONS.INACTIVE_PS);
    await organizationQueries.relations.users.insert({
      organizationId: organization.id,
      userId: user.id,
    });
    return organization;
  } catch (error) {
    getConsoleLogFromContext(ctx).error(
      `OGCIO: User registration - ${phrases.en.errors.entity.not_exists_with_id}`,
      error
    );
  }
};

const assignOrganizationRoleToUser = async (
  user: User,
  organization: Organization,
  organizationQueries: OrganizationQueries,
  ctx: WithHooksAndLogsContext
) => {
  try {
    const publicServantRole = await organizationQueries.roles.findById(
      OGCIO_ORGANIZATION_ROLES.INACTIVE_PUBLIC_SERVANT
    );
    const alreadyHas = await organizationQueries.relations.usersRoles.exists({
      organizationId: organization.id,
      organizationRoleId: publicServantRole.id,
      userId: user.id,
    });

    if (alreadyHas) {
      return;
    }

    await organizationQueries.relations.usersRoles.insert({
      organizationId: organization.id,
      organizationRoleId: publicServantRole.id,
      userId: user.id,
    });
  } catch (error) {
    getConsoleLogFromContext(ctx).error(
      `OGCIO: User registration - Inactive Public Servant role with ID ${OGCIO_ORGANIZATION_ROLES.INACTIVE_PUBLIC_SERVANT} couldn't be assigned to the user`,
      error
    );
  }
};

const assignInactivePublicServantRole = async (
  user: User,
  organizationQueries: OrganizationQueries,
  ctx: WithHooksAndLogsContext
) => {
  const organization = await assignUserToOrganization(user, organizationQueries, ctx);

  if (!organization) {
    getConsoleLogFromContext(ctx).error(
      `OGCIO: User registration - user couldn't be assigned to organization with ID ${OGCIO_ORGANIZATIONS.INACTIVE_PS}`
    );
    return;
  }

  await assignOrganizationRoleToUser(user, organization, organizationQueries, ctx);
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
  findUserRoles: (userId: string) => Promise<readonly UsersRole[]>,
  organizationQueries: OrganizationQueries,
  ctx: WithHooksAndLogsContext,
  registrationStep = true
) => {
  getConsoleLogFromContext(ctx).info(
    `OGCIO: New user registration with tenantID: ${user.tenantId}`
  );

  if (user.tenantId === adminTenantId) {
    return;
  }

  const identities = getUserIdentities(user);

  getConsoleLogFromContext(ctx).info(
    `OGCIO: User registration - user identities: ${identities.join(', ')}`
  );

  if (identities.includes(OGCIO_ENTRA_ID_IDENTITY) && registrationStep) {
    getConsoleLogFromContext(ctx).info(
      `OGCIO: User registration - EntraID identity found, assigning inactive public servant role to the user.`
    );
    return assignInactivePublicServantRole(user, organizationQueries, ctx);
  }

  return manageDefaultCitizenRole(
    user,
    getRoles,
    insertUsersRoles,
    findUserRoles,
    organizationQueries,
    ctx,
    identities
  );
};

const manageDefaultCitizenRole = async (
  user: User,
  getRoles: (id: string) => Promise<Role>,
  insertUsersRoles: (
    usersRoles: CreateUsersRole[]
  ) => Promise<QueryResult<QueryResultRow> | undefined>,
  findUserRoles: (userId: string) => Promise<readonly UsersRole[]>,
  organizationQueries: OrganizationQueries,
  ctx: WithHooksAndLogsContext,
  identities: string[]
) => {
  if (!identities.includes(OGCIO_MY_GOV_ID_IDENTITY)) {
    return;
  }

  const relatedOrganizations = await organizationQueries.relations.users.getOrganizationsByUserId(
    user.id
  );

  if (relatedOrganizations.length > 0) {
    return;
  }

  // Check if already has citizen role
  const userRoles = await findUserRoles(user.id);
  if (userRoles.some((ur) => ur.id === OGCIO_ROLES.BB_CITIZEN)) {
    return;
  }

  getConsoleLogFromContext(ctx).info(
    `OGCIO: User registration - MyGovID identity found, assigning citizen role to the user.`
  );

  return assignCitizenRole(user, getRoles, insertUsersRoles, ctx);
};
