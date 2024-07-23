const quota_table = {
  quota: {
    title: '기본',
    base_price: '기본 가격',
    mau_limit: 'MAU 한도',
    included_tokens: '포함된 토큰',
  },
  application: {
    title: '애플리케이션',
    total: '총 애플리케이션 수',
    m2m: '머신 투 머신',
    third_party: '타사 앱',
  },
  resource: {
    title: 'API 리소스',
    resource_count: '리소스 수',
    scopes_per_resource: '리소스 당 권한',
  },
  branding: {
    title: 'UI 및 브랜딩',
    custom_domain: '사용자 정의 도메인',
    custom_css: '사용자 정의 CSS',
    logo_and_favicon: '로고 및 파비콘',
    bring_your_ui: '자신의 UI 가져오기',
    dark_mode: '다크 모드',
    i18n: '국제화',
  },
  user_authn: {
    title: '사용자 인증',
    omni_sign_in: '옴니 로그인',
    password: '비밀번호',
    passwordless: '비밀번호 없음 - 이메일 및 SMS',
    email_connector: '이메일 커넥터',
    sms_connector: 'SMS 커넥터',
    social_connectors: '소셜 커넥터',
    standard_connectors: '표준 커넥터',
    built_in_email_connector: '내장 이메일 커넥터',
    mfa: '다중 인증',
    sso: '기업 SSO',
    adaptive_mfa: '적응형 MFA',
    impersonation: '가장하기',
  },
  user_management: {
    title: '사용자 관리',
    user_management: '사용자 관리',
    roles: '역할',
    machine_to_machine_roles: '머신 투 머신 역할',
    scopes_per_role: '역할 당 권한',
  },
  organizations: {
    title: '조직',
    organizations: '조직',
    organization: '조직',
    organization_count: '조직 수',
    allowed_users_per_org: '조직 당 허용된 사용자',
    invitation: '초대 (Management API)',
    org_roles: '조직 역할',
    org_permissions: '조직 권한',
    just_in_time_provisioning: '적시 프로비저닝',
  },
  support: {
    title: '컴플라이언스 및 지원',
    community: '커뮤니티',
    customer_ticket: '지원 티켓',
    premium: '프리미엄',
    email_ticket_support: '이메일 티켓 지원',
    soc2_report: 'SOC2 보고서',
    hipaa_or_baa_report: 'HIPAA/BAA 보고서',
  },
  developers_and_platform: {
    title: '개발자와 플랫폼',
    hooks: '웹훅',
    audit_logs_retention: '감사 로그 보존',
    jwt_claims: 'JWT 클레임',
    tenant_members: '테넌트 멤버',
  },
  unlimited: '무제한',
  contact: '문의',
  monthly_price: '${{value, number}}/월',
  days_one: '{{count, number}} 일',
  days_other: '{{count, number}} 일',
  add_on: '부가 기능',
  tier: '레벨{{value, number}}: ',
  paid_token_limit_tip:
    'Logto 는 할당량 한도를 초과하는 기능에 대해 요금을 부과할 것입니다. 2024년 제 2분기부터 요금이 부과될 때까지 무료로 사용할 수 있습니다. 더 많은 토큰이 필요한 경우 저희에게 문의하십시오. 기본적으로 100만 토큰 당 월 $80 을 청구합니다.',
  paid_quota_limit_tip:
    'Logto 는 할당량 제한을 초과하는 기능에 대해 요금을 부과할 것입니다. 2024년 제 2분기까지는 무료로 사용할 수 있습니다.',
  paid_add_on_feature_tip:
    '이것은 부가 기능입니다. 2024년 제 2분기까지는 무료로 사용할 수 있습니다.',
  million: '{{value, number}} 백만',
  mau_tip:
    'MAU (월간 활성 사용자) 는 청구 주기 동안 Logto 와 적어도 하나의 토큰을 교환한 고유 사용자 수를 의미합니다.',
  tokens_tip: 'Logto 에서 발행한 모든 종류의 토큰, 액세스 토큰, 리프레시 토큰 등을 포함합니다.',
  mao_tip:
    'MAO (월간 활성 조직) 는 빌링 주기 내에서 적어도 하나의 MAU (월간 활성 사용자) 를 가진 고유한 조직의 수를 의미합니다.',
  third_party_tip: '타사 앱의 로그인 및 권한 부여에 대해 OIDC ID 공급자로서 Logto 를 사용합니다.',
  included: '{{value, number}} 포함',
  included_mao: '{{value, number}} MAO 포함',
  extra_quota_price: '이후 월당 ${{value, number}} / 각각',
  per_month_each: '월당 ${{value, number}} / 각각',
  extra_mao_price: '이후 MAO 당 ${{value, number}}',
  per_month: '월당 ${{value, number}}',
  per_member: '그런 다음 ${{value, number}} / 회원',
};

export default Object.freeze(quota_table);
