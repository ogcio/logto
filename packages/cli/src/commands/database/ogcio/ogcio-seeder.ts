export type OgcioTenantSeeder = Record<string, OgcioSeeder>;

export type OgcioSeeder = {
  organizations: Organization[];
  organization_permissions: OrganizationPermission[];
  organization_roles: OrganizationRole[];
  applications: Application[];
  resources: Resource[];
  resource_permissions: ResourcePermission[];
  resource_roles: ResourceRole[];
};

export type Organization = {
  name: string;
  description: string;
};

export type OrganizationPermission = {
  actions: string[];
  entities: string[];
};

export type OrganizationRole = {
  name: string;
  actions: string[];
  entities?: string[];
  specific_permissions?: string[];
};

export type Application = {
  name: string;
  description: string;
  type: string;
  redirect_uri: string;
  app_logout_redirect_uri: string;
};

export type Resource = {
  id: string;
  name: string;
  indicator: string;
};

export type ResourcePermission = {
  for_resource_ids: string[];
  actions: string[];
  entities: string[];
};

export type ResourceRole = {
  name: string;
  permissions: PermissionPerResourceRole[];
};

export type PermissionPerResourceRole = {
  for_resource_ids: string[];
  actions: string[];
  entities?: string[];
  specific_permissions?: string[];
};
