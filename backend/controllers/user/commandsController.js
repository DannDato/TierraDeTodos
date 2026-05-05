import { models } from '../../models/index.js';
import handleError from '../../handlers/handleError.js';

const safeParsePermissions = (rawValue) => {
  if (!rawValue) return [];
  if (Array.isArray(rawValue)) {
    return rawValue.map((value) => String(value || '').trim()).filter(Boolean);
  }

  try {
    const parsed = JSON.parse(String(rawValue));
    if (!Array.isArray(parsed)) return [];
    return parsed.map((value) => String(value || '').trim()).filter(Boolean);
  } catch (_error) {
    return [];
  }
};

class CommandsController {
  getUserCommands = async (req, res) => {
    try {
      const userPermissions = Array.isArray(req.user?.permissions) ? req.user.permissions : [];
      const permissionSet = new Set(userPermissions.map((key) => String(key || '').trim()).filter(Boolean));

      const rows = await models.commands.findAll({
        where: { active: true },
        order: [['command', 'ASC']]
      });

      const commands = rows
        .map((row) => {
          const plain = row.toJSON();
          const requiredPermissions = safeParsePermissions(plain.permissions);
          const canUse = requiredPermissions.length === 0 || requiredPermissions.some((key) => permissionSet.has(key));

          return {
            id: plain.id,
            command: plain.command,
            description: plain.description,
            details: String(plain.details || ''),
            permissions: requiredPermissions,
            active: Boolean(plain.active),
            canUse
          };
        })
        .filter((item) => item.canUse)
        .map(({ canUse, ...item }) => item);

      return res.status(200).json({ commands });
    } catch (error) {
      return handleError(res, req, error, 'Error al obtener comandos del usuario');
    }
  };
}

const ctrlCommands = new CommandsController();
export { ctrlCommands };
