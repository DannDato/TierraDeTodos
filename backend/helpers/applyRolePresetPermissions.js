import { models } from '../models/index.js';

export const applyRolePresetPermissions = async ({ userId, role, transaction }) => {
  const presets = await models.PresetPermissions.findAll({
    where: {
      role,
      active: true
    },
    attributes: ['permissionKey'],
    transaction
  });

  const presetPermissionKeys = [...new Set(presets.map((preset) => preset.permissionKey))];

  await models.UserPermissions.destroy({
    where: { userId },
    transaction
  });

  if (presetPermissionKeys.length === 0) {
    return [];
  }

  const permissions = await models.Permissions.findAll({
    where: {
      key: presetPermissionKeys,
      active: true
    },
    attributes: ['id', 'key'],
    transaction
  });

  if (permissions.length === 0) {
    return [];
  }

  await models.UserPermissions.bulkCreate(
    permissions.map((permission) => ({ userId, permissionId: permission.id })),
    { transaction }
  );

  return permissions.map((permission) => permission.key);
};