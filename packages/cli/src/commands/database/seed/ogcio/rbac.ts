/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @silverhand/fp/no-mutating-methods */
/* eslint-disable @silverhand/fp/no-mutation */
import { OrganizationScopes, OrganizationRoles } from '@logto/schemas';
import { generateStandardId } from '@logto/shared';
import { type QueryResult, sql, type DatabaseTransactionConnection } from 'slonik';

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

const getInsertedId = async (
  transaction: DatabaseTransactionConnection,
  tenantId: string,
  name: string,
  table: string
): Promise<string | undefined> => {
  const scope = await transaction.query<{ id: string }>(sql`
    select id from ${sql.identifier([table])}
      where tenant_id = ${tenantId}
      and name = ${name}
      limit 1
  `);

  return getIdByQueryResult(scope);
};

const createScope = async (
  transaction: DatabaseTransactionConnection,
  tenantId: string,
  scopeToSeed: SeedingScope
) => {
  consoleLog.info(`Creating scope. TenantId: ${tenantId}. Name: ${scopeToSeed.name}`);
  const scopeIdBefore = await getInsertedId(
    transaction,
    tenantId,
    scopeToSeed.name,
    OrganizationScopes.table
  );
  if (scopeIdBefore !== undefined) {
    consoleLog.info(
      `Creating scope. TenantId: ${tenantId}. Name: ${scopeToSeed.name}. Already exists.`
    );
    scopeToSeed.id = scopeIdBefore;
    return scopeToSeed;
  }

  const scopeData = {
    id: generateStandardId(),
    tenant_id: tenantId,
    name: scopeToSeed.name,
    description: scopeToSeed.name,
  };

  await transaction.query(insertInto(scopeData, OrganizationScopes.table));
  scopeToSeed.id = await getInsertedId(
    transaction,
    tenantId,
    scopeToSeed.name,
    OrganizationScopes.table
  );
  if (scopeToSeed.id !== undefined) {
    consoleLog.info(
      `Creating scope. TenantId: ${tenantId}. Name: ${scopeToSeed.name}. Created, Id ${scopeToSeed.id}`
    );
    return scopeToSeed;
  }

  throw new Error(
    `OGCIO seeding. Failure inserting scope with tenant id ${tenantId} and name ${scopeToSeed.name}`
  );
};

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
) => {
  consoleLog.info(`Creating role. TenantId: ${tenantId}. Name: ${roleToSeed.name}`);
  const roleIdBefore = await getInsertedId(
    transaction,
    tenantId,
    roleToSeed.name,
    OrganizationRoles.table
  );
  if (roleIdBefore !== undefined) {
    consoleLog.info(
      `Creating role. TenantId: ${tenantId}. Name: ${roleToSeed.name}. Already exists.`
    );
    roleToSeed.id = roleIdBefore;
    return roleToSeed;
  }
  const roleData = {
    id: generateStandardId(),
    tenant_id: tenantId,
    name: roleToSeed.name,
    description: roleToSeed.description,
  };
  await transaction.query(insertInto(roleData, OrganizationRoles.table));
  const roleIdAfter = await getInsertedId(
    transaction,
    tenantId,
    roleToSeed.name,
    OrganizationRoles.table
  );
  if (roleIdAfter !== undefined) {
    roleToSeed.id = roleIdAfter;
    consoleLog.info(
      `Creating role. TenantId: ${tenantId}. Name: ${roleToSeed.name}. Created, Id ${roleIdAfter}`
    );
    return roleToSeed;
  }

  throw new Error(
    `OGCIO seeding. Failure inserting role with tenant id ${tenantId} and name ${roleToSeed.name}`
  );
};

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
