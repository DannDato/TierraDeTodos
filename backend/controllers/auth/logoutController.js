import { models } from '../../models/index.js';
import { Op } from 'sequelize';

export const logout = async (req, res) => {
  const { allDevices = false } = req.body || {};

  try {
    let affectedRows = 0;

    if (allDevices) {
      const [updatedRows] = await models.Sessions.update(
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

      affectedRows = updatedRows;
    } else {
      const [updatedRows] = await models.Sessions.update(
        { revoked: true },
        {
          where: {
            id: req.session.id,
            userId: req.user.id,
            revoked: false
          }
        }
      );

      affectedRows = updatedRows;
    }

    await req.logAction({
      accion: allDevices ? 'Logout global exitoso' : 'Logout exitoso',
      apartado: 'Logout',
      userId: req.user.id,
      username: req.user.username,
      valor: allDevices ? 'allDevices=true' : `sessionId=${req.session.id}`,
      type: 'info'
    });

    return res.status(200).json({
      message: allDevices
        ? 'Sesión cerrada en todos los dispositivos'
        : 'Sesión cerrada correctamente',
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
