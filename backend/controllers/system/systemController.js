import os from 'os';
import { Op } from 'sequelize';
import { db, models } from '../../models/index.js';
import handleError from '../../handlers/handleError.js';

class SystemController {
  parseSettingValue = (row, rawValue) => {
    const type = row.type;

    if (type === 'boolean') {
      if (typeof rawValue === 'boolean') return rawValue;
      return String(rawValue).toLowerCase() === 'true';
    }

    if (type === 'number') {
      return Number(rawValue);
    }

    return rawValue;
  };

  toPersistedValue = (row, inputValue) => {
    if (row.type === 'boolean') {
      if (typeof inputValue === 'boolean') return String(inputValue);
      const normalized = String(inputValue).trim().toLowerCase();
      if (['true', '1', 'yes', 'si'].includes(normalized)) return 'true';
      if (['false', '0', 'no'].includes(normalized)) return 'false';
      throw new Error(`Valor invalido para ${row.key}`);
    }

    if (row.type === 'number') {
      const numeric = Number(inputValue);
      if (!Number.isFinite(numeric)) {
        throw new Error(`Valor numerico invalido para ${row.key}`);
      }
      return String(numeric);
    }

    if (row.type === 'enum') {
      const candidate = String(inputValue);
      const options = Array.isArray(row.options) ? row.options : [];
      if (!options.includes(candidate)) {
        throw new Error(`Valor invalido para ${row.key}. Opciones: ${options.join(', ')}`);
      }
      return candidate;
    }

    return String(inputValue ?? '');
  };

  serializeSetting = (row) => ({
    key: row.key,
    groupKey: row.groupKey,
    label: row.label,
    description: row.description,
    type: row.type,
    value: this.parseSettingValue(row, row.value),
    defaultValue: this.parseSettingValue(row, row.defaultValue),
    options: Array.isArray(row.options) ? row.options : [],
    updatedBy: row.updatedBy,
    updatedAt: row.updatedAt,
  });

  getSettings = async (req, res) => {
    try {
      const rows = await models.SystemSettings.findAll({
        order: [['groupKey', 'ASC'], ['id', 'ASC']],
      });

      const settings = rows.map((row) => this.serializeSetting(row));

      return res.status(200).json({ settings });
    } catch (error) {
      return handleError(res, req, error, 'Error al obtener configuraciones del sistema');
    }
  };

  updateSettings = async (req, res) => {
    const transaction = await db.transaction();

    try {
      const payload = req.body?.updates;
      const updates = payload && typeof payload === 'object' ? payload : null;

      if (!updates || Object.keys(updates).length === 0) {
        await transaction.rollback();
        return res.status(400).json({ message: 'No hay cambios para guardar' });
      }

      const keys = Object.keys(updates);
      const rows = await models.SystemSettings.findAll({
        where: { key: keys },
        transaction,
      });

      if (rows.length !== keys.length) {
        await transaction.rollback();
        const found = new Set(rows.map((row) => row.key));
        const missing = keys.filter((key) => !found.has(key));
        return res.status(404).json({ message: `Configuraciones no encontradas: ${missing.join(', ')}` });
      }

      for (const row of rows) {
        const nextValue = this.toPersistedValue(row, updates[row.key]);
        row.value = nextValue;
        row.updatedBy = req.user?.id || null;
        await row.save({ transaction });
      }

      await transaction.commit();

      await req.logAction({
        accion: 'Configuraciones del sistema actualizadas',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `keys=${keys.join(',')}`,
        type: 'info',
      });

      const updatedRows = await models.SystemSettings.findAll({
        where: { key: keys },
        order: [['groupKey', 'ASC'], ['id', 'ASC']],
      });

      return res.status(200).json({
        message: 'Configuraciones guardadas correctamente',
        updated: updatedRows.map((row) => this.serializeSetting(row)),
      });
    } catch (error) {
      return handleError(res, req, error, 'Error al actualizar configuraciones del sistema', transaction);
    }
  };

  getHealth = async (req, res) => {
    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      const [usersCount, activeSessionsCount, pendingDevicesCount, deniedDevicesCount, failedAttemptsLast5m] = await Promise.all([
        models.Users.count(),
        models.Sessions.count({
          where: {
            revoked: false,
            expiresAt: { [Op.gt]: now },
          },
        }),
        models.UserDevices.count({ where: { authorized: 'PENDING' } }),
        models.UserDevices.count({ where: { authorized: 'DENIED' } }),
        models.Attempts.count({
          where: {
            status: 'FAILED',
            createdAt: { [Op.gte]: fiveMinutesAgo },
          },
        }),
      ]);

      return res.status(200).json({
        health: {
          db: 'up',
          usersCount,
          activeSessionsCount,
          pendingDevicesCount,
          deniedDevicesCount,
          failedAttemptsLast5m,
          serverUptimeSeconds: Math.floor(process.uptime()),
          memoryUsage: process.memoryUsage(),
          loadAverage: os.loadavg(),
          platform: os.platform(),
          nodeVersion: process.version,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      return handleError(res, req, error, 'Error al obtener salud del sistema');
    }
  };
}

const ctrlSystem = new SystemController();
export { ctrlSystem };
