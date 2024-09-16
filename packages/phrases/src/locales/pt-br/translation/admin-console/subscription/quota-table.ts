const quota_table = {
  quota: {
    title: 'Básico',
    base_price: 'Preço base',
    mau_limit: 'Limite de MAU',
    included_tokens: 'Tokens incluídos',
  },
  application: {
    title: 'Aplicações',
    total: 'Total de aplicações',
    m2m: 'Aplicação máquina-a-máquina',
    third_party: 'Aplicativos de terceiros',
  },
  resource: {
    title: 'Recursos de API',
    resource_count: 'Contagem de recursos',
    scopes_per_resource: 'Permissões por recurso',
  },
  branding: {
    title: 'Interface de usuário e branding',
    custom_domain: 'Domínio personalizado',
    custom_css: 'CSS personalizado',
    logo_and_favicon: 'Logo e favicon',
    bring_your_ui: 'Traga sua UI',
    dark_mode: 'Modo escuro',
    i18n: 'Internacionalização',
  },
  user_authn: {
    title: 'Autenticação de usuário',
    omni_sign_in: 'Entrada Omni',
    password: 'Senha',
    passwordless: 'Sem senha - E-mail e SMS',
    email_connector: 'Conector de e-mail',
    sms_connector: 'Conector de SMS',
    social_connectors: 'Conectores sociais',
    standard_connectors: 'Conectores padrão',
    built_in_email_connector: 'Conector de e-mail integrado',
    mfa: 'Autenticação multifator',
    sso: 'SSO Empresarial',

    impersonation: 'Impersonação',
  },
  user_management: {
    title: 'Gerenciamento de usuários',
    user_management: 'Gerenciamento de usuários',
    roles: 'Funções',
    machine_to_machine_roles: 'Funções de máquina-a-máquina',
    scopes_per_role: 'Permissões por função',
  },
  organizations: {
    title: 'Organização',
    organizations: 'Organizações',
    organization: 'Organização',
    organization_count: 'Contagem de organizações',
    allowed_users_per_org: 'Usuários por organização',
    invitation: 'Convite (API de Gerenciamento)',
    org_roles: 'Funções da organização',
    org_permissions: 'Permissões da organização',
    just_in_time_provisioning: 'Provisionamento just-in-time',
  },
  support: {
    /** UNTRANSLATED */
    title: 'Support',
    community: 'Comunidade',
    customer_ticket: 'Ticket de suporte',
    premium: 'Premium',
    email_ticket_support: 'Suporte por e-mail',
    soc2_report: 'Relatório SOC2',
    hipaa_or_baa_report: 'Relatório HIPAA/BAA',
  },
  developers_and_platform: {
    title: 'Desenvolvedores e plataforma',
    hooks: 'Webhooks',
    audit_logs_retention: 'Retenção de logs de auditoria',
    jwt_claims: 'Reivindicações JWT',
    tenant_members: 'Membros do locatário',
  },
  unlimited: 'Ilimitado',
  contact: 'Contato',
  monthly_price: '${ { value, number } }/mês',
  days_one: '${ { count, number } } dia',
  days_other: '${ { count, number } } dias',
  add_on: 'Adicional',
  tier: 'Nível${ { value, number } }:',

  million: '{{value, number}} milhão',
  mau_tip:
    'MAU (usuários ativos mensais) significa o número de usuários únicos que trocaram pelo menos um token com o Logto em um ciclo de faturamento.',
  tokens_tip:
    'Todos os tipos de tokens emitidos pelo Logto, incluindo token de acesso, token de atualização, etc.',
  mao_tip:
    'MAO (Organização Ativa Mensal) significa o número de organizações únicas que têm pelo menos um MAU (Usuário Ativo Mensal) em um ciclo de faturamento.',
  third_party_tip:
    'Use Logto como seu provedor de identidade OIDC para logins e concessões de permissão de aplicativos de terceiros.',
  included: 'incluído{{value, number}}',
  included_mao: '{{value, number}} MAO incluído',
  extra_quota_price: 'Então ${{value, number}} por mês / cada depois',
  per_month_each: '${{value, number}} por mês / cada',
  extra_mao_price: 'Então ${{value, number}} por MAO',
  per_month: '${{value, number}} por mês',
  per_member: 'Então ${{value, number}} por membro',
};

export default Object.freeze(quota_table);
