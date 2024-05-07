const role = {
  name_in_use: 'このロール名{{name}}はすでに使用されています',
  scope_exists: 'スコープID {{scopeId}}はすでにこのロールに追加されています',
  /** UNTRANSLATED */
  management_api_scopes_not_assignable_to_user_role:
    'Cannot assign management API scopes to a user role.',
  user_exists: 'ユーザーID{{userId}}はすでにこのロールに追加されています',
  application_exists: 'アプリケーション ID {{applicationId}} はすでにこのロールに追加されています',
  default_role_missing:
    'データベースにデフォルトロール名が存在しないものがあります。ロールを作成してください',
  internal_role_violation:
    'Logtoによって許可されていない内部ロールの更新または削除を試みている可能性があります。新しいロールを作成する場合は、「#internal：」で始まる別の名前を試してください。',
  default_organization_missing:
    'Some of the default organizations does not exist in database, please ensure to create organizations first',
};

export default Object.freeze(role);
