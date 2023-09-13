const paywall = {
  applications:
    'Osiągnięto limit {{count, number}} aplikacji dla <planName/>. Zaktualizuj plan, aby sprostać potrzebom zespołu. W razie potrzeby pomocy, proszę <a>skontaktuj się z nami</a>.',
  applications_other:
    'Osiągnięto limit {{count, number}} aplikacji dla <planName/>. Zaktualizuj plan, aby sprostać potrzebom zespołu. W razie potrzeby pomocy, proszę <a>skontaktuj się z nami</a>.',
  machine_to_machine_feature:
    'Zaktualizuj plan na płatny, aby tworzyć aplikacje maszynowe i uzyskać dostęp do wszystkich funkcji premium. W razie potrzeby pomocy, proszę <a>skontaktuj się z nami</a>.',
  machine_to_machine:
    'Osiągnięto limit {{count, number}} aplikacji maszynowych dla <planName/>. Zaktualizuj plan, aby sprostać potrzebom zespołu. W razie potrzeby pomocy, proszę <a>skontaktuj się z nami</a>.',
  machine_to_machine_other:
    'Osiągnięto limit {{count, number}} aplikacji maszynowych dla <planName/>. Zaktualizuj plan, aby sprostać potrzebom zespołu. W razie potrzeby pomocy, proszę <a>skontaktuj się z nami</a>.',
  resources:
    'Osiągnięto limit {{count, number}} zasobów API w planie <planName/>. Ulepsz plan, aby sprostać potrzebom twojego zespołu. Skontaktuj się z nami <a>tutaj</a>, jeśli potrzebujesz pomocy.',
  resources_other:
    'Osiągnięto limit {{count, number}} zasobów API w planie <planName/>. Ulepsz plan, aby sprostać potrzebom twojego zespołu. Skontaktuj się z nami <a>tutaj</a>, jeśli potrzebujesz pomocy.',
  scopes_per_resource:
    'Osiągnięto limit {{count, number}} uprawnień na zasób API w planie <planName/>. Zaktualizuj plan, aby rozszerzyć. Skontaktuj się z nami <a>tutaj</a>, jeśli potrzebujesz pomocy.',
  scopes_per_resource_other:
    'Osiągnięto limit {{count, number}} uprawnień na zasób API w planie <planName/>. Zaktualizuj plan, aby rozszerzyć. Skontaktuj się z nami <a>tutaj</a>, jeśli potrzebujesz pomocy.',
  custom_domain:
    'Odblokuj funkcję niestandardowego domeny i szereg korzyści premium, ulepszając do płatnego planu. Jeśli potrzebujesz pomocy, nie wahaj się <a>skontaktować z nami</a>.',
  social_connectors:
    'Osiągnięto limit {{count, number}} konektorów społecznościowych w planie <planName/>. Aby sprostać potrzebom twojego zespołu, ulepsz plan, aby uzyskać dodatkowe konektory społecznościowe oraz możliwość tworzenia własnych konektorów za pomocą protokołów OIDC, OAuth 2.0 i SAML. Jeśli potrzebujesz pomocy, nie wahaj się <a>skontaktować z nami</a>.',
  social_connectors_other:
    'Osiągnięto limit {{count, number}} konektorów społecznościowych w planie <planName/>. Aby sprostać potrzebom twojego zespołu, ulepsz plan, aby uzyskać dodatkowe konektory społecznościowe oraz możliwość tworzenia własnych konektorów za pomocą protokołów OIDC, OAuth 2.0 i SAML. Jeśli potrzebujesz pomocy, nie wahaj się <a>skontaktować z nami</a>.',
  standard_connectors_feature:
    'Ulepsz do płatnego planu, aby tworzyć własne konektory za pomocą protokołów OIDC, OAuth 2.0 i SAML, oraz uzyskać nieograniczoną liczbę konektorów społecznościowych i wszystkie funkcje premium. Jeśli potrzebujesz pomocy, nie wahaj się <a>skontaktować z nami</a>.',
  standard_connectors:
    'Osiągnięto limit {{count, number}} konektorów społecznościowych w planie <planName/>. Aby sprostać potrzebom twojego zespołu, ulepsz plan, aby uzyskać dodatkowe konektory społecznościowe oraz możliwość tworzenia własnych konektorów za pomocą protokołów OIDC, OAuth 2.0 i SAML. Jeśli potrzebujesz pomocy, nie wahaj się <a>skontaktować z nami</a>.',
  standard_connectors_other:
    'Osiągnięto limit {{count, number}} konektorów społecznościowych w planie <planName/>. Aby sprostać potrzebom twojego zespołu, ulepsz plan, aby uzyskać dodatkowe konektory społecznościowe oraz możliwość tworzenia własnych konektorów za pomocą protokołów OIDC, OAuth 2.0 i SAML. Jeśli potrzebujesz pomocy, nie wahaj się <a>skontaktować z nami</a>.',
  standard_connectors_pro:
    'Osiągnięto limit {{count, number}} standardowych konektorów w planie <planName/>. Aby sprostać potrzebom twojego zespołu, ulepsz do planu Enterprise, aby uzyskać dodatkowe konektory społecznościowe oraz możliwość tworzenia własnych konektorów za pomocą protokołów OIDC, OAuth 2.0 i SAML. Jeśli potrzebujesz pomocy, nie wahaj się <a>skontaktować z nami</a>.',
  standard_connectors_pro_other:
    'Osiągnięto limit {{count, number}} standardowych konektorów w planie <planName/>. Aby sprostać potrzebom twojego zespołu, ulepsz do planu Enterprise, aby uzyskać dodatkowe konektory społecznościowe oraz możliwość tworzenia własnych konektorów za pomocą protokołów OIDC, OAuth 2.0 i SAML. Jeśli potrzebujesz pomocy, nie wahaj się <a>skontaktować z nami</a>.',
  roles:
    'Osiągnięto limit {{count, number}} ról w planie <planName/>. Ulepsz plan, aby dodać dodatkowe role i uprawnienia. Jeśli potrzebujesz pomocy, nie wahaj się <a>skontaktować z nami</a>.',
  roles_other:
    'Osiągnięto limit {{count, number}} ról w planie <planName/>. Ulepsz plan, aby dodać dodatkowe role i uprawnienia. Jeśli potrzebujesz pomocy, nie wahaj się <a>skontaktować z nami</a>.',
  scopes_per_role:
    'Osiągnięto limit {{count, number}} uprawnień na rolę w planie <planName/>. Ulepsz plan, aby dodać dodatkowe role i uprawnienia. W razie potrzeby, skontaktuj się z nami <a>tutaj</a>.',
  scopes_per_role_other:
    'Osiągnięto limit {{count, number}} uprawnień na rolę w planie <planName/>. Ulepsz plan, aby dodać dodatkowe role i uprawnienia. W razie potrzeby, skontaktuj się z nami <a>tutaj</a>.',
  hooks:
    'Osiągnięto limit {{count, number}} webhooków w planie <planName/>. Ulepsz plan, aby tworzyć więcej webhooków. Jeśli potrzebujesz pomocy, nie wahaj się <a>skontaktować z nami</a>.',
  hooks_other:
    'Osiągnięto limit {{count, number}} webhooków w planie <planName/>. Ulepsz plan, aby tworzyć więcej webhooków. Jeśli potrzebujesz pomocy, nie wahaj się <a>skontaktować z nami</a>.',
};

export default Object.freeze(paywall);