export const FK_DEFINITIONS = [
  { name: 'fk_community_lider', table: 'community', fields: ['lider'], referencedTable: 'Users', referencedFields: ['id'], options: { onDelete: 'RESTRICT' } },
  { name: 'fk_streamer_userId', table: 'streamer', fields: ['userID'], referencedTable: 'Users', referencedFields: ['id'], options: { onDelete: 'CASCADE' } },
  { name: 'fk_user_devices_userId', table: 'user_devices', fields: ['user'], referencedTable: 'Users', referencedFields: ['id'], options: { onDelete: 'SET NULL' } },
  { name: 'fk_sessions_userId', table: 'Sessions', fields: ['userId'], referencedTable: 'Users', referencedFields: ['id'], options: { onDelete: 'CASCADE' } },
  { name: 'fk_user_community_userId', table: 'user_community', fields: ['userId'], referencedTable: 'Users', referencedFields: ['id'], options: { onDelete: 'CASCADE' } },
  { name: 'fk_user_com_req_userId', table: 'user_community_request', fields: ['userId'], referencedTable: 'Users', referencedFields: ['id'], options: { onDelete: 'CASCADE' } },
  { name: 'fk_user_com_req_reviewedBy', table: 'user_community_request', fields: ['reviewedBy'], referencedTable: 'Users', referencedFields: ['id'], options: { onDelete: 'SET NULL' } },
  { name: 'fk_user_editions_userId', table: 'user_editions', fields: ['userID'], referencedTable: 'Users', referencedFields: ['id'], options: { onDelete: 'CASCADE' } },
  { name: 'fk_user_permissions_userId', table: 'user_permissions', fields: ['userId'], referencedTable: 'Users', referencedFields: ['id'], options: { onDelete: 'CASCADE' } },
  { name: 'fk_user_profile_images_userId', table: 'user_profile_images', fields: ['userId'], referencedTable: 'Users', referencedFields: ['id'], options: { onDelete: 'CASCADE' } },
  { name: 'fk_user_passwords_userId', table: 'User_passwords', fields: ['userId'], referencedTable: 'Users', referencedFields: ['id'], options: { onDelete: 'CASCADE' } },
  { name: 'fk_user_tokens_userId', table: 'user_tokens', fields: ['userId'], referencedTable: 'Users', referencedFields: ['id'], options: { onDelete: 'CASCADE' } },
  { name: 'fk_user_mails_userId', table: 'user_mails', fields: ['userId'], referencedTable: 'Users', referencedFields: ['id'], options: { onDelete: 'CASCADE' } },
  { name: 'fk_user_usernames_userId', table: 'user_usernames', fields: ['userId'], referencedTable: 'Users', referencedFields: ['id'], options: { onDelete: 'CASCADE' } },
  { name: 'fk_access_codes_user', table: 'access_codes', fields: ['user'], referencedTable: 'Users', referencedFields: ['id'], options: { onDelete: 'CASCADE' } },
  { name: 'fk_attempts_user', table: 'Attempts', fields: ['user'], referencedTable: 'Users', referencedFields: ['id'], options: { onDelete: 'SET NULL' } },
  { name: 'fk_user_status_history_user', table: 'user_status_history', fields: ['user'], referencedTable: 'Users', referencedFields: ['id'], options: { onDelete: 'SET NULL' } },
  { name: 'fk_user_status_history_changed_by', table: 'user_status_history', fields: ['changed_by'], referencedTable: 'Users', referencedFields: ['id'], options: { onDelete: 'SET NULL' } },
  { name: 'fk_news_comments_userId', table: 'news_comments', fields: ['user_id'], referencedTable: 'Users', referencedFields: ['id'], options: { onDelete: 'CASCADE' } },
  { name: 'fk_likes_userId', table: 'likes', fields: ['user_id'], referencedTable: 'Users', referencedFields: ['id'], options: { onDelete: 'CASCADE' } },
  { name: 'fk_tickets_userId', table: 'tickets', fields: ['user_id'], referencedTable: 'Users', referencedFields: ['id'], options: { onDelete: 'CASCADE' } },
  { name: 'fk_tickets_messages_userId', table: 'tickets_messages', fields: ['user_id'], referencedTable: 'Users', referencedFields: ['id'], options: { onDelete: 'CASCADE' } },
  { name: 'fk_user_emblems_userId', table: 'user_emblems', fields: ['userId'], referencedTable: 'Users', referencedFields: ['id'], options: { onDelete: 'CASCADE' } },
  { name: 'fk_user_goals_userId', table: 'user_goals', fields: ['userId'], referencedTable: 'Users', referencedFields: ['id'], options: { onDelete: 'CASCADE' } },

  { name: 'fk_user_community_communityId', table: 'user_community', fields: ['communityId'], referencedTable: 'community', referencedFields: ['id'], options: { onDelete: 'CASCADE' } },
  { name: 'fk_user_com_req_communityId', table: 'user_community_request', fields: ['communityId'], referencedTable: 'community', referencedFields: ['id'], options: { onDelete: 'CASCADE' } },

  { name: 'fk_edition_dates_editionId', table: 'edition_dates', fields: ['editionId'], referencedTable: 'edition', referencedFields: ['id'], options: { onDelete: 'CASCADE' } },
  { name: 'fk_edition_rules_editionId', table: 'edition_rules', fields: ['editionId'], referencedTable: 'edition', referencedFields: ['id'], options: { onDelete: 'CASCADE' } },
  { name: 'fk_user_editions_editionId', table: 'user_editions', fields: ['editionId'], referencedTable: 'edition', referencedFields: ['id'], options: { onDelete: 'CASCADE' } },
  { name: 'fk_emblems_editionId', table: 'emblems', fields: ['editionId'], referencedTable: 'edition', referencedFields: ['id'], options: { onDelete: 'CASCADE' } },
  { name: 'fk_goals_editionId', table: 'goals', fields: ['editionId'], referencedTable: 'edition', referencedFields: ['id'], options: { onDelete: 'CASCADE' } },
  { name: 'fk_user_emblems_editionId', table: 'user_emblems', fields: ['editionId'], referencedTable: 'edition', referencedFields: ['id'], options: { onDelete: 'CASCADE' } },
  { name: 'fk_user_goals_editionId', table: 'user_goals', fields: ['editionId'], referencedTable: 'edition', referencedFields: ['id'], options: { onDelete: 'CASCADE' } },

  { name: 'fk_news_comments_newsId', table: 'news_comments', fields: ['news_id'], referencedTable: 'news', referencedFields: ['id'], options: { onDelete: 'CASCADE' } },
  { name: 'fk_tickets_messages_ticketId', table: 'tickets_messages', fields: ['ticket_id'], referencedTable: 'tickets', referencedFields: ['id'], options: { onDelete: 'CASCADE' } },

  { name: 'fk_goals_emblemId', table: 'goals', fields: ['emblemId'], referencedTable: 'emblems', referencedFields: ['id'], options: { onDelete: 'CASCADE' } },
  { name: 'fk_user_emblems_emblemId', table: 'user_emblems', fields: ['emblemId'], referencedTable: 'emblems', referencedFields: ['id'], options: { onDelete: 'CASCADE' } },

  { name: 'fk_user_goals_goalId', table: 'user_goals', fields: ['goalId'], referencedTable: 'goals', referencedFields: ['id'], options: { onDelete: 'CASCADE' } },
  { name: 'fk_user_emblems_sourceGoalId', table: 'user_emblems', fields: ['sourceGoalId'], referencedTable: 'goals', referencedFields: ['id'], options: { onDelete: 'SET NULL' } },

  { name: 'fk_user_permissions_permission', table: 'user_permissions', fields: ['permission'], referencedTable: 'Permissions', referencedFields: ['key'], options: { onDelete: 'CASCADE' } },
  { name: 'fk_preset_permissions_permission', table: 'preset_permissions', fields: ['permissionKey'], referencedTable: 'Permissions', referencedFields: ['key'], options: { onDelete: 'CASCADE' } },
  { name: 'fk_command_permissions_permission', table: 'command_permissions', fields: ['permission_key'], referencedTable: 'Permissions', referencedFields: ['key'], options: { onDelete: 'CASCADE' } },

  { name: 'fk_preset_permissions_role', table: 'preset_permissions', fields: ['role'], referencedTable: 'Roles', referencedFields: ['role'], options: { onDelete: 'CASCADE' } },

  { name: 'fk_command_permissions_command', table: 'command_permissions', fields: ['command_id'], referencedTable: 'commands', referencedFields: ['id'], options: { onDelete: 'CASCADE' } },
];

export const SEED_ORDER = [
  'Roles',
  'Permissions',
  'PresetPermissions',
  'Users',
  'Edition',
  'news',
  'community',
  'emblems',
  'user_profile_images',
  'commands',
  'command_permissions',
  'UserPermissions',
  'catalog'
];
