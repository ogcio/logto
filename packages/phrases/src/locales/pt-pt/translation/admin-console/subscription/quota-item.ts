const quota_item = {
  tenant_limit: {
    name: 'Inquilinos',
    limited: '{{count, number}} inquilino',
    limited_other: '{{count, number}} inquilinos',
    unlimited: 'Inquilinos ilimitados',
    not_eligible: 'Eliminar os teus inquilinos',
  },
  mau_limit: {
    name: 'Utilizadores ativos mensais',
    limited: '{{count, number}} MAU',
    unlimited: 'Utilizadores ativos mensais ilimitados',
    not_eligible: 'Remover todos os utilizadores',
  },
  token_limit: {
    name: 'Tokens',
    limited: '{{count, number}} token',
    limited_other: '{{count, number}} tokens',
    unlimited: 'Tokens ilimitados',
    not_eligible: 'Remover os teus utilizadores para evitar novos tokens',
  },
  applications_limit: {
    name: 'Aplicações',
    limited: '{{count, number}} aplicação',
    limited_other: '{{count, number}} aplicações',
    unlimited: 'Aplicações ilimitadas',
    not_eligible: 'Remover as tuas aplicações',
  },
  machine_to_machine_limit: {
    name: 'Máquina para máquina',
    limited: '{{count, number}} aplicação de máquina para máquina',
    limited_other: '{{count, number}} aplicações de máquina para máquina',
    unlimited: 'Aplicações de máquina para máquina ilimitadas',
    not_eligible: 'Remover as tuas aplicações de máquina para máquina',
  },
  third_party_applications_limit: {
    name: 'Aplicações de terceiros',
    limited: '{{count, number}} aplicação de terceiros',
    limited_other: '{{count, number}} aplicações de terceiros',
    unlimited: 'Aplicações de terceiros ilimitadas',
    not_eligible: 'Remover as tuas aplicações de terceiros',
  },
  resources_limit: {
    name: 'Recursos de API',
    limited: '{{count, number}} recurso de API',
    limited_other: '{{count, number}} recursos de API',
    unlimited: 'Recursos de API ilimitados',
    not_eligible: 'Remover os teus recursos de API',
  },
  scopes_per_resource_limit: {
    name: 'Permissões de recursos',
    limited: '{{count, number}} permissão por recurso',
    limited_other: '{{count, number}} permissões por recurso',
    unlimited: 'Permissão por recurso ilimitada',
    not_eligible: 'Remover as tuas permissões de recurso',
  },
  custom_domain_enabled: {
    name: 'Domínio personalizado',
    limited: 'Domínio personalizado',
    unlimited: 'Domínio personalizado',
    not_eligible: 'Remover o teu domínio personalizado',
  },
  omni_sign_in_enabled: {
    name: 'Omni sign-in',
    limited: 'Omni sign-in',
    unlimited: 'Omni sign-in',
    not_eligible: 'Desativar o teu omni sign-in',
  },
  built_in_email_connector_enabled: {
    name: 'Conector de e-mail incorporado',
    limited: 'Conector de e-mail incorporado',
    unlimited: 'Conector de e-mail incorporado',
    not_eligible: 'Remover o teu conector de e-mail incorporado',
  },
  social_connectors_limit: {
    name: 'Conectores sociais',
    limited: '{{count, number}} conector social',
    limited_other: '{{count, number}} conectores sociais',
    unlimited: 'Conectores sociais ilimitados',
    not_eligible: 'Remover os teus conectores sociais',
  },
  standard_connectors_limit: {
    name: 'Conectores padrão gratuitos',
    limited: '{{count, number}} conector padrão gratuito',
    limited_other: '{{count, number}} conectores padrão gratuitos',
    unlimited: 'Conectores padrão ilimitados',
    not_eligible: 'Remover os teus conectores padrão',
  },
  roles_limit: {
    name: 'Funções',
    limited: '{{count, number}} função',
    limited_other: '{{count, number}} funções',
    unlimited: 'Funções ilimitadas',
    not_eligible: 'Remover as tuas funções',
  },
  machine_to_machine_roles_limit: {
    name: 'Funções de máquina para máquina',
    limited: '{{count, number}} função de máquina para máquina',
    limited_other: '{{count, number}} funções de máquina para máquina',
    unlimited: 'Funções de máquina para máquina ilimitadas',
    not_eligible: 'Remover as tuas funções de máquina para máquina',
  },
  scopes_per_role_limit: {
    name: 'Permissões de função',
    limited: '{{count, number}} permissão por função',
    limited_other: '{{count, number}} permissões por função',
    unlimited: 'Permissão por função ilimitada',
    not_eligible: 'Remover as tuas permissões de função',
  },
  hooks_limit: {
    name: 'Webhooks',
    limited: '{{count, number}} webhook',
    limited_other: '{{count, number}} webhooks',
    unlimited: 'Webhooks ilimitados',
    not_eligible: 'Remova os teus webhooks',
  },
  organizations_enabled: {
    name: 'Organizações',
    limited: 'Organizações',
    unlimited: 'Organizações',
    not_eligible: 'Remover as tuas organizações',
  },
  audit_logs_retention_days: {
    name: 'Conservação de registos de auditoria',
    limited: 'Conservação de registos de auditoria: {{count, number}} dia',
    limited_other: 'Conservação de registos de auditoria: {{count, number}} dias',
    unlimited: 'Dias ilimitados',
    not_eligible: 'Sem registos de auditoria',
  },
  email_ticket_support: {
    name: 'Suporte por e-mail',
    limited: '{{count, number}} horas de suporte por e-mail',
    limited_other: '{{count, number}} horas de suporte por e-mail',
    unlimited: 'Suporte por e-mail',
    not_eligible: 'Sem suporte por e-mail',
  },
  mfa_enabled: {
    name: 'Autenticação de dois fatores',
    limited: 'Autenticação de dois fatores',
    unlimited: 'Autenticação de dois fatores',
    not_eligible: 'Remova a sua autenticação de dois fatores',
  },
  sso_enabled: {
    name: 'SSO Empresarial',
    limited: 'SSO Empresarial',
    unlimited: 'SSO Empresarial',
    not_eligible: 'Remover o teu SSO Empresarial',
  },
  tenant_members_limit: {
    name: 'Membros do inquilino',
    limited: '{{count, number}} membro do inquilino',
    limited_other: '{{count, number}} membros do inquilino',
    unlimited: 'Membros do inquilino ilimitados',
    not_eligible: 'Remove os teus membros do inquilino',
  },
  custom_jwt_enabled: {
    name: 'JWT personalizado',
    limited: 'JWT personalizado',
    unlimited: 'JWT personalizado',
    not_eligible: 'Remove o teu personalizador de reivindicações JWT',
  },
  impersonation_enabled: {
    name: 'Impersonação',
    limited: 'Impersonação',
    unlimited: 'Impersonação',
    not_eligible: 'Não está permitido a personificação',
  },
  bring_your_ui_enabled: {
    name: 'Traga a sua interface gráfica',
    limited: 'Traga a sua interface gráfica',
    unlimited: 'Traga a sua interface gráfica',
    not_eligible: 'Remova os teus ativos de UI personalizados',
  },
};

export default Object.freeze(quota_item);
