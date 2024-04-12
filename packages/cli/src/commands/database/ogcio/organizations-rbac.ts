/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @silverhand/fp/no-mutating-methods */
/* eslint-disable @silverhand/fp/no-mutation */
import { OrganizationScopes, OrganizationRoles } from '@logto/schemas';
import { sql, type DatabaseTransactionConnection } from '@silverhand/slonik';

import { type OrganizationPermissionSeeder, type OrganizationRoleSeeder } from './ogcio-seeder.js';
import { createItem, createItemWithoutId } from './queries.js';

const createOrganizationScope = async (
  transaction: DatabaseTransactionConnection,
  tenantId: string,
  scopeToSeed: SeedingScope
) =>
  createItem({
    transaction,
    tenantId,
    toInsert: scopeToSeed,
    toLogFieldName: 'name',
    itemTypeName: 'Organization Scope',
    whereClauses: [sql`name = ${scopeToSeed.name}`],
    tableName: OrganizationScopes.table,
  });

type SeedingScope = {
  name: string;
  id?: string | undefined;
  description: string;
};

type ScopesLists = {
  scopesList: SeedingScope[];
  scopesByEntity: Record<string, SeedingScope[]>;
  scopesByAction: Record<string, SeedingScope[]>;
  scopesByFullName: Record<string, SeedingScope>;
};

const buildScopeFullName = (entity: string, action: string): string => `${entity}:${action}`;

const fillScopesGroup = (seeder: OrganizationPermissionSeeder, fullLists: ScopesLists) => {
  const { scopesByEntity, scopesList, scopesByAction, scopesByFullName } = fullLists;
  for (const resource of seeder.entities) {
    scopesByEntity[resource] = [];
    for (const action of seeder.actions) {
      const scope: SeedingScope = {
        name: buildScopeFullName(resource, action),
        description: `${action} ${resource}`,
      };
      scopesList.push(scope);
      if (scopesByEntity[resource] === undefined) {
        scopesByEntity[resource] = [];
      }
      scopesByEntity[resource]!.push(scope);
      if (scopesByAction[action] === undefined) {
        scopesByAction[action] = [];
      }
      scopesByAction[action]!.push(scope);

      scopesByFullName[scope.name] = scope;
    }
  }
};

const fillScopes = (scopesToSeed: OrganizationPermissionSeeder[]): ScopesLists => {
  const fullLists: ScopesLists = {
    scopesList: [],
    scopesByEntity: {},
    scopesByAction: {},
    scopesByFullName: {},
  };

  for (const singleSeeder of scopesToSeed) {
    fillScopesGroup(singleSeeder, fullLists);
  }

  return fullLists;
};

const setScopeId = async (
  element: SeedingScope,
  transaction: DatabaseTransactionConnection,
  tenantId: string
) => {
  element = await createOrganizationScope(transaction, tenantId, element);
};

const createScopes = async (
  transaction: DatabaseTransactionConnection,
  tenantId: string,
  scopesToSeed: OrganizationPermissionSeeder[]
): Promise<ScopesLists> => {
  const scopesToCreate = fillScopes(scopesToSeed);
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
  id?: string | undefined;
};

const getScopesBySpecificPermissions = (
  specificPerms: string[] | undefined,
  scopesLists: ScopesLists
): SeedingScope[] => {
  if (!specificPerms || specificPerms.length === 0) {
    return [];
  }
  const outputPerms = [];
  for (const scopeName of specificPerms) {
    if (!scopesLists.scopesByFullName[scopeName]) {
      throw new Error(`Specific permissions. The requested ${scopeName} scope does not exist!`);
    }
    outputPerms.push(scopesLists.scopesByFullName[scopeName]!);
  }

  return outputPerms;
};

const ensureRoleHasAtLeastOneScope = <T>(roleName: string, scopes: T[]): void => {
  if (scopes.length === 0) {
    throw new Error(`Organization Role ${roleName}. You must assign at least one scope`);
  }
};

const buildCrossScopes = (
  actions: string[],
  entities: string[],
  specificPermissions: string[],
  scopesLists: ScopesLists
): SeedingScope[] => {
  if (actions.length === 0 && entities.length === 0) {
    return [];
  }
  const scopesByAction = actions.length > 0 ? actions : Object.keys(scopesLists.scopesByAction);
  const scopesByEntity = entities.length > 0 ? entities : Object.keys(scopesLists.scopesByEntity);
  const byFullname: SeedingScope[] = [];
  for (const action of scopesByAction) {
    for (const entity of scopesByEntity) {
      const fullName = buildScopeFullName(entity, action);
      if (
        scopesLists.scopesByFullName[fullName] !== undefined &&
        !specificPermissions.includes(fullName)
      ) {
        byFullname.push(scopesLists.scopesByFullName[fullName]!);
      }
    }
  }

  return byFullname;
};
const getScopesPerRole = (
  roleToSeed: OrganizationRoleSeeder,
  scopesLists: ScopesLists
): SeedingScope[] => {
  const inputSpecific = roleToSeed.specific_permissions ?? [];
  const specificScopes = getScopesBySpecificPermissions(inputSpecific, scopesLists);
  const byAction = roleToSeed.actions ?? [];
  const byEntity = roleToSeed.entities ?? [];
  ensureRoleHasAtLeastOneScope(roleToSeed.name, [...specificScopes, ...byAction, ...byEntity]);

  const fullList = [
    ...buildCrossScopes(byAction, byEntity, inputSpecific, scopesLists),
    ...specificScopes,
  ];

  ensureRoleHasAtLeastOneScope(roleToSeed.name, fullList);

  return fullList;
};
const fillRole = (roleToSeed: OrganizationRoleSeeder, scopesLists: ScopesLists): SeedingRole => ({
  name: roleToSeed.name,
  description: roleToSeed.description,
  scopes: getScopesPerRole(roleToSeed, scopesLists),
});

const fillRoles = (rolesToSeed: OrganizationRoleSeeder[], scopesLists: ScopesLists) =>
  rolesToSeed.map((role) => fillRole(role, scopesLists));

const createRole = async (
  transaction: DatabaseTransactionConnection,
  tenantId: string,
  roleToSeed: SeedingRole
) => {
  const created = await createItem({
    transaction,
    tableName: OrganizationRoles.table,
    tenantId,
    toLogFieldName: 'name',
    whereClauses: [sql`name = ${roleToSeed.name}`],
    toInsert: { name: roleToSeed.name, description: roleToSeed.description },
    itemTypeName: 'Organization Role',
  });

  roleToSeed.id = created.id;

  return roleToSeed;
};

type SeedingRelation = { organization_role_id: string; organization_scope_id: string };

const createRoleScopeRelation = async (
  transaction: DatabaseTransactionConnection,
  tenantId: string,
  relation: SeedingRelation
) =>
  createItemWithoutId({
    transaction,
    tableName: 'organization_role_scope_relations',
    tenantId,
    toLogFieldName: 'organization_role_id',
    whereClauses: [
      sql`organization_role_id = ${relation.organization_role_id}`,
      sql`organization_scope_id = ${relation.organization_scope_id}`,
    ],
    toInsert: relation,
    itemTypeName: 'Organization Scope-Role relation',
    columnToGet: 'organization_role_id',
  });

const createRelations = async (
  transaction: DatabaseTransactionConnection,
  tenantId: string,
  roles: Record<string, SeedingRole>
) => {
  const queries: Array<Promise<SeedingRelation>> = [];
  for (const role of Object.values(roles)) {
    for (const scope of role.scopes) {
      queries.push(
        createRoleScopeRelation(transaction, tenantId, {
          organization_role_id: role.id!,
          organization_scope_id: scope.id!,
        })
      );
    }
  }
  return Promise.all(queries);
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
  scopesLists: ScopesLists,
  rolesToSeed: OrganizationRoleSeeder[]
): Promise<Record<string, SeedingRole>> => {
  const rolesToCreate = fillRoles(rolesToSeed, scopesLists);
  const queries: Array<Promise<void>> = [];
  const outputList: Record<string, SeedingRole> = {};
  for (const role of rolesToCreate) {
    queries.push(addRole(transaction, tenantId, role, outputList));
  }

  await Promise.all(queries);

  return outputList;
};

export const seedOrganizationRbacData = async (
  transaction: DatabaseTransactionConnection,
  tenantId: string,
  toSeed: {
    organization_permissions: OrganizationPermissionSeeder[];
    organization_roles: OrganizationRoleSeeder[];
  }
): Promise<{
  scopes: ScopesLists;
  roles: Record<string, SeedingRole>;
  relations: SeedingRelation[];
}> => {
  const createdScopes = await createScopes(transaction, tenantId, toSeed.organization_permissions);
  // Const createdRoles = await createRoles(
  //   transaction,
  //   tenantId,
  //   createdScopes,
  //   toSeed.organization_roles
  // );
  // const relations = await createRelations(transaction, tenantId, createdRoles);
  return {
    scopes: {
      scopesList: [],
      scopesByEntity: {},
      scopesByAction: {},
      scopesByFullName: {},
    },
    roles: {},
    relations: [],
  };
  // Return { scopes: createdScopes, roles: createdRoles, relations };
};
