import { models } from '../../models/index.js';
import { Op } from 'sequelize';

class LogoutController {
  logout = async (req, res) => {
  try {
    const currentDeviceHash = req.session?.device || null;

    const [affectedRows] = await models.Sessions.update(
      { revoked: true },
      {
        where: {
          id: req.session.id,
          userId: req.user.id,
          revoked: false
        }
      }
    );

    let pendingDevicesUpdated = 0;

    if (currentDeviceHash) {
      const [updatedDevices] = await models.UserDevices.update(
        { authorized: 'PENDING' },
        {
          where: {
            user: req.user.id,
            device_hash: currentDeviceHash,
            authorized: 'AUTHORIZED'
          }
        }
      );

      pendingDevicesUpdated = updatedDevices;
    }

    await req.logAction({
      accion: 'Logout exitoso',
      apartado: 'Logout',
      userId: req.user.id,
      username: req.user.username,
      valor: `sessionId=${req.session.id}; deviceHash=${currentDeviceHash || 'unknown'}; devicesPending=${pendingDevicesUpdated}`,
      type: 'info'
    });

    return res.status(200).json({
      message: 'Sesión cerrada correctamente',
      affectedRows
    });
  } catch (error) {
    await req.logAction({
      accion: 'Error al cerrar sesión',
      apartado: 'Logout',
      userId: req.user?.id,
      username: req.user?.username,
      valor: error.message,
      type: 'error'
    });

    return res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
  };

  logoutAll = async (req, res) => {
    try {
      const [affectedRows] = await models.Sessions.update(
        { revoked: true },
        {
          where: {
            userId: req.user.id,
            revoked: false,
            expiresAt: {
              [Op.gt]: new Date()
            }
          }
        }
      );

      const [pendingDevicesUpdated] = await models.UserDevices.update(
        { authorized: 'PENDING' },
        {
          where: {
            user: req.user.id,
            authorized: 'AUTHORIZED'
          }
        }
      );

      await req.logAction({
        accion: 'Logout global exitoso',
        apartado: 'Logout',
        userId: req.user.id,
        username: req.user.username,
        valor: `scope=all-sessions; devicesPending=${pendingDevicesUpdated}`,
        type: 'info'
      });

      return res.status(200).json({
        message: 'Sesión cerrada en todos los dispositivos',
        affectedRows
      });
    } catch (error) {
      await req.logAction({
        accion: 'Error al cerrar sesión global',
        apartado: 'Logout',
        userId: req.user?.id,
        username: req.user?.username,
        valor: error.message,
        type: 'error'
      });

      return res.status(500).json({
        message: 'Error interno del servidor'
      });
    }
  };
}

const ctrlLogout = new LogoutController();
export { ctrlLogout };

