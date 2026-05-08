import { db, models } from '../../../models/index.js';
import { QueryTypes } from 'sequelize';
import handleError from '../../../handlers/handleError.js';

class sessionsController {
  getGlobalSessions = async (req, res) => {
    try {
      const now = new Date();

      const sessions = await db.query(
        `
          SELECT
            s.id,
            s.userId,
            u.username,
            s.device,
            s.ip,
            s.createdAt,
            s.expiresAt,
            s.revoked,
            (
              SELECT ud.folio
              FROM user_devices ud
              WHERE ud.user = s.userId
              AND ud.user_agent = s.device
              ORDER BY ud.last_login DESC, ud.id DESC
              LIMIT 1
            ) AS deviceFolio
          FROM Sessions s
          INNER JOIN Users u ON u.id = s.userId
          WHERE s.revoked = 0
          AND s.expiresAt > :now
          ORDER BY s.createdAt DESC
        `,
        {
          replacements: { now },
          type: QueryTypes.SELECT
        }
      );

      const data = sessions.map((session) => {
        return {
          id: session.id,
          userId: session.userId,
          username: session.username,
          device: session.device || 'unknown-device',
          deviceFolio: session.deviceFolio || null,
          ip: session.ip || null,
          startedAt: session.createdAt,
          expiresAt: session.expiresAt,
          revoked: Boolean(session.revoked),
          status: 'ACTIVE',
          isActive: true
        };
      });

      await req.logAction({
        accion: 'Sesiones globales consultadas',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `sessions=${data.length}`,
        type: 'info'
      });

      return res.status(200).json({ sessions: data });
    } catch (error) {
      return handleError(res, req, error, 'Error al listar sesiones globales');
    }
  };

  revokeSession = async (req, res) => {
    try {
      const sessionId = Number(req.params.id);

      if (!sessionId) {
        return res.status(400).json({ message: 'ID de sesion invalido' });
      }

      const session = await models.Sessions.findByPk(sessionId, {
        attributes: ['id', 'userId', 'revoked', 'expiresAt'],
        include: [
          {
            model: models.Users,
            as: 'user',
            attributes: ['username']
          }
        ]
      });

      if (!session) {
        return res.status(404).json({ message: 'Sesion no encontrada' });
      }

      if (session.revoked) {
        return res.status(200).json({
          message: 'La sesion ya estaba cerrada',
          session: {
            id: session.id,
            userId: session.userId,
            username: session.user?.username || null,
            revoked: true
          }
        });
      }

      session.revoked = true;
      await session.save();

      await req.logAction({
        accion: 'Sesion cerrada por administrador',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `sessionId=${session.id}; targetUserId=${session.userId}; targetUsername=${session.user?.username || ''}`,
        type: 'info'
      });

      return res.status(200).json({
        message: 'Sesion cerrada correctamente',
        session: {
          id: session.id,
          userId: session.userId,
          username: session.user?.username || null,
          revoked: true
        }
      });
    } catch (error) {
      return handleError(res, req, error, 'Error al cerrar sesion global');
    }
  };
}

const ctrlSessions = new sessionsController();
export { ctrlSessions };

