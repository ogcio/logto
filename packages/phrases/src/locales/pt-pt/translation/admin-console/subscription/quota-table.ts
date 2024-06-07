const quota_table = {
  quota: {
    title: 'Básicos',
    base_price: 'Preço base',
    mau_limit: 'Limite de MAU',
    included_tokens: 'Tokens incluídos',
  },
  application: {
    title: 'Aplicações',
    total: 'Total de aplicações',
    m2m: 'Aplicações de máquina para máquina',
    third_party: 'Aplicações de terceiros',
  },
  resource: {
    title: 'Recursos da API',
    resource_count: 'Contagem de recursos',
    scopes_per_resource: 'Permissões por recurso',
  },
  branding: {
    title: 'UI e branding',
    custom_domain: 'Domínio personalizado',
    custom_css: 'CSS personalizado',
    app_logo_and_favicon: 'Logótipo da aplicação e favicon',
    dark_mode: 'Modo escuro',
    i18n: 'Internacionalização',
  },
  user_authn: {
    title: 'Autenticação do utilizador',
    omni_sign_in: 'Início de sessão Omni',
    password: 'Palavra-passe',
    passwordless: 'Sem palavra-passe - E-mail e SMS',
    email_connector: 'Conector de e-mail',
    sms_connector: 'Conector de SMS',
    social_connectors: 'Conectores sociais',
    standard_connectors: 'Conectores padrão',
    built_in_email_connector: 'Conector de e-mail incorporado',
    mfa: 'Autenticação de vários fatores',
    sso: 'SSO Empresarial',
    adaptive_mfa: 'MFA adaptativo',
  },
  user_management: {
    title: 'Gestão de utilizadores',
    user_management: 'Gestão de utilizadores',
    roles: 'Funções',
    machine_to_machine_roles: 'Funções de máquina para máquina',
    scopes_per_role: 'Permissões por função',
  },
  organizations: {
    title: 'Organização',
    organizations: 'Organizações',
    organization: 'Organização',
    organization_count: 'Contagem de organizações',
    allowed_users_per_org: 'Utilizadores por organização',
    invitation: 'Convite (Management API)',
    org_roles: 'Funções da organização',
    org_permissions: 'Permissões da organização',
    just_in_time_provisioning: 'Provisionamento just-in-time',
  },
  support: {
    title: 'Conformidade e suporte',
    community: 'Comunidade',
    customer_ticket: 'Bilhete de suporte',
    premium: 'Premium',
    email_ticket_support: 'Suporte por bilhete de e-mail',
    soc2_report: 'Relatório SOC2',
    hipaa_or_baa_report: 'Relatório HIPAA/BAA',
  },
  developers_and_platform: {
    title: 'Programadores e plataforma',
    hooks: 'Webhooks',
    audit_logs_retention: 'Retenção de registos de auditoria',
    jwt_claims: 'Reivindicações JWT',
    tenant_members: 'Membros do inquilino',
  },
  unlimited: 'Ilimitado',
  contact: 'Contactar',
  monthly_price: '${{value, number}}/mês',
  days_one: '{{count, number}} dia',
  days_other: '{{count, number}} dias',
  add_on: 'Suplemento',
  tier: 'Nível{{value, number}}: ',
  paid_token_limit_tip:
    'O Logto adicionará cobranças para funcionalidades que ultrapassem o limite da sua quota. Pode utilizá-lo gratuitamente até começarmos a cobrar por volta do segundo trimestre de 2024. Se precisar de mais tokens, por favor, entre em contacto connosco. Por padrão, cobramos $80 por mês por cada milhão de tokens.',
  paid_quota_limit_tip:
    'O Logto adicionará encargos por funcionalidades que ultrapassem o seu limite de quota. Pode utilizá-lo sem custos até começarmos a cobrar, aproximadamente no segundo trimestre de 2024.',
  paid_add_on_feature_tip:
    'Esta é uma funcionalidade adicional. Pode utilizá-la sem custos até começarmos a cobrar, aproximadamente no segundo trimestre de 2024.',
  million: '{{value, number}} milhão',
  mau_tip:
    'MAU (utilizadores ativos mensais) significa o número de utilizadores únicos que trocaram pelo menos um token com o Logto num ciclo de faturação.',
  tokens_tip:
    'Todos os tipos de tokens emitidos pelo Logto, incluindo token de acesso, token de atualização, etc.',
  mao_tip:
    'MAO (Organização Ativa Mensal) significa o número de organizações únicas que têm pelo menos um MAU (Utilizador Ativo Mensal) num ciclo de faturação.',
  third_party_tip:
    'Utilize o Logto como o seu fornecedor de identidade OIDC para inícios de sessão de aplicações de terceiros e outorga de permissões.',
  included: 'incluído{{value, number}}',
  included_mao: '{{value, number}} MAO incluída',
  extra_quota_price: 'Depois ${{value, number}} por mês / cada um depois',
  per_month_each: '${{value, number}} por mês / cada um',
  extra_mao_price: 'Depois ${{value, number}} por MAO',
  per_month: '${{value, number}} por mês',
  per_member: 'Depois ${{value, number}} por membro',
};

export default Object.freeze(quota_table);
