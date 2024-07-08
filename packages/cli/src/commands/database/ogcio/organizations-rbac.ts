/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

/* eslint-disable @silverhand/fp/no-mutation */
/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */

import {
  OrganizationRoles,
  OrganizationRoleScopeRelations,
  OrganizationScopes,
} from '@logto/schemas';
import { sql, type DatabaseTransactionConnection } from '@silverhand/slonik';

import { type OrganizationPermissionSeeder, type OrganizationRoleSeeder } from './ogcio-seeder.js';
import { createOrUpdateItem, createOrUpdateItemWithoutId, deleteQuery } from './queries.js';

type SeedingScope = {
  name: string;
  id?: string;
  description: string;
};
type ScopesByName = Record<string, SeedingScope>;

type SeedingRole = {
  name: string;
  id: string;
  description: string;
  scopes: string[];
};

type SeedingRelation = { organization_role_id: string; organization_scope_id: string };

const createScope = async (params: {
  transaction: DatabaseTransactionConnection;
  tenantId: string;
  scopeToSeed: SeedingScope;
}) =>
  createOrUpdateItem({
    transaction: params.transaction,
    tenantId: params.tenantId,
    toInsert: params.scopeToSeed,
    toLogFieldName: 'name',
    tableName: OrganizationScopes.table,
    whereClauses: [sql`tenant_id = ${params.tenantId}`, sql`name = ${params.scopeToSeed.name}`],
  });

const buildScopes = (scopes: string[]): ScopesByName => {
  return scopes.reduce<ScopesByName>((accumulator, scopeName) => {
    accumulator[scopeName] = {
      name: scopeName,
      description: scopeName,
    };
    return accumulator;
  }, {});
};

export const createScopes = async (params: {
  transaction: DatabaseTransactionConnection;
  tenantId: string;
  scopesToSeed: OrganizationPermissionSeeder;
}) => {
  const scopesToCreate = buildScopes(params.scopesToSeed.specific_permissions);

  const queries = Object.values(scopesToCreate).map(async (scope) =>
    createScope({
      transaction: params.transaction,
      tenantId: params.tenantId,
      scopeToSeed: scope,
    })
  );

  await Promise.all(queries);

  return scopesToCreate;
};

const createRole = async (params: {
  transaction: DatabaseTransactionConnection;
  tenantId: string;
  roleToSeed: {
    name: string;
    description: string;
    id: string;
  };
}) => {
  await createOrUpdateItem({
    transaction: params.transaction,
    tenantId: params.tenantId,
    toLogFieldName: 'name',
    whereClauses: [sql`tenant_id = ${params.tenantId}`, sql`id = ${params.roleToSeed.id}`],
    toInsert: {
      id: params.roleToSeed.id,
      name: params.roleToSeed.name,
      description: params.roleToSeed.description,
    },
    tableName: OrganizationRoles.table,
  });

  return params.roleToSeed;
};

const createRoles = async (params: {
  transaction: DatabaseTransactionConnection;
  tenantId: string;
  scopes: ScopesByName;
  rolesToSeed: OrganizationRoleSeeder[];
}) => {
  const rolesToCreate = params.rolesToSeed.map((role) => ({
    id: role.id,
    name: role.name,
    description: role.description,
    scopes: role.specific_permissions,
  }));

  const queries = rolesToCreate.map(async (role) =>
    createRole({
      transaction: params.transaction,
      tenantId: params.tenantId,
      roleToSeed: role,
    })
  );

  await Promise.all(queries);

  return rolesToCreate;
};

const createRoleScopeRelation = async (
  transaction: DatabaseTransactionConnection,
  tenantId: string,
  relation: SeedingRelation
) =>
  createOrUpdateItemWithoutId({
    transaction,
    tableName: OrganizationRoleScopeRelations.table,
    tenantId,
    toLogFieldName: 'organization_role_id',
    whereClauses: [
      sql`tenant_id = ${tenantId}`,
      sql`organization_role_id = ${relation.organization_role_id}`,
      sql`organization_scope_id = ${relation.organization_scope_id}`,
    ],
    toInsert: relation,
    columnToGet: 'organization_role_id',
  });

const createRelations = async (
  transaction: DatabaseTransactionConnection,
  tenantId: string,
  scopes: ScopesByName,
  roles: SeedingRole[]
) => {
  const queries = roles.flatMap((role) =>
    role.scopes.map(async (scope) =>
      createRoleScopeRelation(transaction, tenantId, {
        organization_role_id: role.id,
        organization_scope_id: scopes[scope]?.id!,
      })
    )
  );

  return Promise.all(queries);
};

export const cleanScopes = async (transaction: DatabaseTransactionConnection, tenantId: string) => {
  await cleanScopeRelations(transaction, tenantId);
  const deleteQueryString = deleteQuery([sql`tenant_id = ${tenantId}`], OrganizationScopes.table);
  return transaction.query(deleteQueryString);
};

export const cleanScopeRelations = async (
  transaction: DatabaseTransactionConnection,
  tenantId: string
) => {
  const deleteQueryString = deleteQuery(
    [sql`tenant_id = ${tenantId}`],
    OrganizationRoleScopeRelations.table
  );
  return transaction.query(deleteQueryString);
};

export const seedOrganizationRbacData = async (params: {
  transaction: DatabaseTransactionConnection;
  tenantId: string;
  toSeed: {
    organization_permissions?: OrganizationPermissionSeeder;
    organization_roles?: OrganizationRoleSeeder[];
  };
}) => {
  if (params.toSeed.organization_permissions && params.toSeed.organization_roles?.length) {
    await cleanScopes(params.transaction, params.tenantId);

    const createdScopes = await createScopes({
      transaction: params.transaction,
      tenantId: params.tenantId,
      scopesToSeed: params.toSeed.organization_permissions,
    });

    const createdRoles = await createRoles({
      transaction: params.transaction,
      tenantId: params.tenantId,
      scopes: createdScopes,
      rolesToSeed: params.toSeed.organization_roles,
    });

    await createRelations(params.transaction, params.tenantId, createdScopes, createdRoles);
  }
};