/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @silverhand/fp/no-mutating-methods */
/* eslint-disable @silverhand/fp/no-mutation */
import { OrganizationScopes, OrganizationRoles } from '@logto/schemas';
import { sql, type DatabaseTransactionConnection } from 'slonik';

import { createItem } from './queries.js';

const createScope = async (
  transaction: DatabaseTransactionConnection,
  tenantId: string,
  scopeToSeed: SeedingScope
) =>
  createItem({
    transaction,
    tenantId,
    toInsert: scopeToSeed,
    toLogFieldName: 'name',
    itemTypeName: 'Scope',
    whereClauses: [sql`name = ${scopeToSeed.name}`],
    tableName: OrganizationScopes.table,
  });

type SeedingScope = {
  name: string;
  resource: string;
  action: string;
  id: string | undefined;
  description: string;
};

type ScopesLists = {
  scopesList: SeedingScope[];
  scopesByResource: Record<string, SeedingScope[]>;
  scopesByAction: Record<string, SeedingScope[]>;
};

const fillScopes = () => {
  const resources = ['payments', 'messages', 'events'];
  const actions = ['read', 'write', 'create', 'delete'];
  const scopesList: SeedingScope[] = [];
  const scopesByResource: Record<string, SeedingScope[]> = {};
  const scopesByAction: Record<string, SeedingScope[]> = {};

  for (const resource of resources) {
    scopesByResource[resource] = [];
    for (const action of actions) {
      const scope = {
        name: `${resource}:${action}`,
        resource,
        action,
        description: `${action} ${resource}`,
        id: undefined,
      };
      scopesList.push(scope);
      if (scopesByResource[resource] === undefined) {
        scopesByResource[resource] = [scope];
      }
      scopesByResource[resource]!.push(scope);
      if (scopesByAction[action] === undefined) {
        scopesByAction[action] = [];
      }
      scopesByAction[action]!.push(scope);
    }
  }
  const superScope: SeedingScope = {
    name: 'ogcio:admin',
    resource: 'ogcio',
    action: 'admin',
    description: 'OGCIO Admin',
    id: undefined,
  };

  scopesList.push(superScope);
  scopesByResource[superScope.resource] = [superScope];
  scopesByAction[superScope.action] = [superScope];

  return {
    scopesList,
    scopesByResource,
    scopesByAction,
  };
};

const setScopeId = async (
  element: SeedingScope,
  transaction: DatabaseTransactionConnection,
  tenantId: string
) => {
  element = await createScope(transaction, tenantId, element);
};

const createScopes = async (
  transaction: DatabaseTransactionConnection,
  tenantId: string
): Promise<ScopesLists> => {
  const scopesToCreate = fillScopes();
  const queries: Array<Promise<void>> = [];
  for (const element of scopesToCreate.scopesList) {
    queries.push(setScopeId(element, transaction, tenantId));
  }

  await Promise.all(queries);

  return scopesToCreate;
};

type SeedingRole = {
  name: string;
  scopes: SeedingScope[];
  description: string;
  id: string | undefined;
};
const fillRoles = (scopesLists: ScopesLists) => {
  const employee: SeedingRole = {
    name: 'OGCIO Employee',
    scopes: scopesLists.scopesByAction.read!,
    description: 'Only read permissions',
    id: undefined,
  };
  const manager: SeedingRole = {
    name: 'OGCIO Manager',
    scopes: scopesLists.scopesByAction.read!,
    description: 'Read write delete permissions',
    id: undefined,
  };
  // Don't ask me why, linter don't like spread operator, so I add to write multiple lines
  manager.scopes = manager.scopes.concat(scopesLists.scopesByAction.write!);
  manager.scopes = manager.scopes.concat(scopesLists.scopesByAction.delete!);
  const admin: SeedingRole = {
    name: 'OGCIO Admin',
    scopes: scopesLists.scopesByAction.admin!,
    description: 'Read write delete and admin permissions',
    id: undefined,
  };
  admin.scopes = admin.scopes.concat(scopesLists.scopesByAction.write!);
  admin.scopes = admin.scopes.concat(scopesLists.scopesByAction.delete!);
  admin.scopes = admin.scopes.concat(scopesLists.scopesByAction.read!);

  return [admin, manager, employee];
};

const createRole = async (
  transaction: DatabaseTransactionConnection,
  tenantId: string,
  roleToSeed: SeedingRole
) =>
  createItem({
    transaction,
    tableName: OrganizationRoles.table,
    tenantId,
    toLogFieldName: 'name',
    whereClauses: [sql`name = ${roleToSeed.name}`],
    toInsert: roleToSeed,
    itemTypeName: 'Role',
  });

const addRole = async (
  transaction: DatabaseTransactionConnection,
  tenantId: string,
  role: SeedingRole,
  toFill: Record<string, SeedingRole>
) => {
  toFill[role.name] = await createRole(transaction, tenantId, role);
};

const createRoles = async (
  transaction: DatabaseTransactionConnection,
  tenantId: string,
  scopesLists: ScopesLists
): Promise<Record<string, SeedingRole>> => {
  const rolesToCreate = fillRoles(scopesLists);
  const queries: Array<Promise<void>> = [];
  const outputList: Record<string, SeedingRole> = {};
  for (const role of rolesToCreate) {
    queries.push(addRole(transaction, tenantId, role, outputList));
  }

  await Promise.all(queries);

  return outputList;
};

export const seedRbacData = async (
  transaction: DatabaseTransactionConnection,
  tenantId: string
) => {
  const createdScopes = await createScopes(transaction, tenantId);
  const createdRoles = await createRoles(transaction, tenantId, createdScopes);

  return { scopes: createdScopes, roles: createdRoles };
};
