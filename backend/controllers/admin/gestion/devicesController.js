import { db } from '../../../models/index.js';
import { QueryTypes } from 'sequelize';
import handleError from '../../../handlers/handleError.js';

class devicesController {
  getAuthorizedDevices = async (req, res) => {
    try {
      const now = new Date();

      const deviceRows = await db.query(
        `
          SELECT
            ud.id,
            ud.folio,
            ud.user,
            u.username,
            ud.device_hash,
            ud.user_agent,
            ud.ip_address,
            ud.authorized,
            ud.first_login,
            ud.last_login
          FROM user_devices ud
          INNER JOIN Users u ON u.id = ud.user
          ORDER BY ud.first_login ASC
        `,
        { type: QueryTypes.SELECT }
      );

      const activeSessions = await db.query(
        `
          SELECT s.userId, s.device
          FROM Sessions s
          WHERE s.revoked = 0
          AND s.expiresAt > :now
        `,
        {
          replacements: { now },
          type: QueryTypes.SELECT
        }
      );

      const activeSessionLookup = new Set(
        activeSessions.map((session) => `${session.userId}|${session.device || ''}`)
      );

      const data = deviceRows
        .map((row) => {
          const hasActiveSession = activeSessionLookup.has(`${row.user}|${row.user_agent || ''}`);

          return {
            deviceId: row.id,
            folio: row.folio || null,
            deviceHash: row.device_hash,
            userId: row.user,
            username: row.username,
            userAgent: row.user_agent || 'unknown-device',
            ipAddress: row.ip_address || null,
            authorized: row.authorized,
            firstLogin: row.first_login,
            lastLogin: row.last_login,
            isActive: hasActiveSession,
            sessionStatus: hasActiveSession ? 'ACTIVE' : 'INACTIVE'
          };
        })
        .sort((a, b) => new Date(b.firstLogin) - new Date(a.firstLogin));

      return res.status(200).json({ devices: data });
    } catch (error) {
      return handleError(res, req, error, 'Error al listar dispositivos autorizados');
    }
  };

  getDeviceUsageHistory = async (req, res) => {
    try {
      const deviceHash = String(req.params.deviceHash || '').trim().toLowerCase();

      if (!/^[a-f0-9]{64}$/.test(deviceHash)) {
        return res.status(400).json({ message: 'Identificador de dispositivo invalido' });
      }

      const owners = await db.query(
        `
          SELECT
            ud.id,
            ud.folio,
            ud.user,
            u.username,
            ud.authorized,
            ud.user_agent,
            ud.ip_address,
            ud.first_login,
            ud.last_login
          FROM user_devices ud
          INNER JOIN Users u ON u.id = ud.user
          WHERE ud.device_hash = :deviceHash
          ORDER BY ud.first_login ASC
        `,
        {
          replacements: { deviceHash },
          type: QueryTypes.SELECT
        }
      );

      if (owners.length === 0) {
        return res.status(404).json({ message: 'Dispositivo no encontrado' });
      }

      const loginHistory = await db.query(
        `
          SELECT
            a.id,
            a.user,
            u.username,
            a.ip_address,
            a.user_agent,
            a.createdAt
          FROM Attempts a
          LEFT JOIN Users u ON u.id = a.user
          WHERE a.action_type = 'LOGIN'
          AND a.status = 'SUCCESS'
          AND SHA2(CONCAT(IFNULL(a.ip_address, ''), '-', IFNULL(a.user_agent, '')), 256) = :deviceHash
          ORDER BY a.createdAt DESC
        `,
        {
          replacements: { deviceHash },
          type: QueryTypes.SELECT
        }
      );

      const usageByUserMap = new Map();

      for (const owner of owners) {
        usageByUserMap.set(owner.user, {
          deviceId: owner.id,
          userId: owner.user,
          username: owner.username,
          authorized: owner.authorized,
          device: owner.user_agent || 'unknown-device',
          firstLoginAt: owner.first_login,
          lastLoginAt: owner.last_login,
          registeredIp: owner.ip_address,
          sessionsCount: 0,
          logins: []
        });
      }

      for (const attempt of loginHistory) {
        const userId = attempt.user || 0;

        if (!usageByUserMap.has(userId)) {
          usageByUserMap.set(userId, {
            userId,
            username: attempt.username || 'unknown-user',
            authorized: 'UNKNOWN',
            firstLoginAt: null,
            lastLoginAt: null,
            registeredIp: attempt.ip_address,
            sessionsCount: 0,
            logins: []
          });
        }

        const userRow = usageByUserMap.get(userId);
        userRow.sessionsCount += 1;
        userRow.logins.push({
          id: attempt.id,
          at: attempt.createdAt,
          ip: attempt.ip_address,
          userAgent: attempt.user_agent
        });
      }

      const usageByUsers = Array.from(usageByUserMap.values())
        .map((row) => ({
          ...row,
          logins: row.logins.slice(0, 30)
        }))
        .sort((a, b) => {
          if (b.sessionsCount !== a.sessionsCount) return b.sessionsCount - a.sessionsCount;
          return String(a.username).localeCompare(String(b.username));
        });

      return res.status(200).json({
        deviceId: owners[0].id,
        folio: owners[0].folio || null,
        deviceHash,
        titular: {
          deviceId: owners[0].id,
          folio: owners[0].folio || null,
          userId: owners[0].user,
          username: owners[0].username,
          registeredAt: owners[0].first_login,
          registeredIp: owners[0].ip_address,
          device: owners[0].user_agent || 'unknown-device'
        },
        usageByUsers,
        loginAttempts: loginHistory.map((attempt) => ({
          id: attempt.id,
          userId: attempt.user,
          username: attempt.username || 'unknown-user',
          ip: attempt.ip_address,
          userAgent: attempt.user_agent,
          at: attempt.createdAt
        }))
      });
    } catch (error) {
      return handleError(res, req, error, 'Error al obtener historial de uso de dispositivo');
    }
  };

  updateDeviceAuthorization = async (req, res) => {
    const transaction = await db.transaction();

    try {
      const deviceHash = String(req.params.deviceHash || '').trim().toLowerCase();
      const userId = Number(req.params.userId);
      const authorized = String(req.body?.authorized || '').trim().toUpperCase();

      if (!/^[a-f0-9]{64}$/.test(deviceHash)) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Identificador de dispositivo invalido' });
      }

      if (!userId) {
        await transaction.rollback();
        return res.status(400).json({ message: 'ID de usuario invalido' });
      }

      if (!['PENDING', 'AUTHORIZED', 'DENIED'].includes(authorized)) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Valor de authorized invalido' });
      }

      const ownerRows = await db.query(
        `
          SELECT id, user_agent
          FROM user_devices
          WHERE device_hash = :deviceHash
          AND user = :userId
        `,
        {
          replacements: { deviceHash, userId },
          type: QueryTypes.SELECT,
          transaction
        }
      );

      if (ownerRows.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ message: 'No existe relacion usuario-dispositivo' });
      }

      await db.query(
        `
          UPDATE user_devices
          SET authorized = :authorized
          WHERE device_hash = :deviceHash
          AND user = :userId
        `,
        {
          replacements: { authorized, deviceHash, userId },
          type: QueryTypes.UPDATE,
          transaction
        }
      );

      let revokedSessions = 0;

      if (authorized === 'DENIED') {
        const devices = [...new Set(ownerRows.map((row) => row.user_agent).filter(Boolean))];
        if (devices.length > 0) {
          const [affectedRows] = await db.models.Sessions.update(
            { revoked: true },
            {
              where: {
                userId,
                device: devices,
                revoked: false
              },
              transaction
            }
          );
          revokedSessions = affectedRows;
        }
      }

      await transaction.commit();

      await req.logAction({
        accion: 'Autorizacion de dispositivo actualizada',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `deviceHash=${deviceHash}; ownerUserId=${userId}; authorized=${authorized}; revokedSessions=${revokedSessions}`,
        type: 'warning'
      });

      return res.status(200).json({
        message: 'Autorizacion de dispositivo actualizada',
        deviceHash,
        userId,
        authorized,
        revokedSessions
      });
    } catch (error) {
      return handleError(res, req, error, 'Error al actualizar autorizacion de dispositivo', transaction);
    }
  };
}

const ctrlDevices = new devicesController();
export { ctrlDevices };
