import { db, models } from '../../../models/index.js';
import handleError from '../../../handlers/handleError.js';

class StatusController {
  getStatuses = async (req, res) => {
    try {
      const [statuses] = await db.query(`
        SELECT
          us.id,
          us.status,
          us.detail,
          us.color,
          us.asignable,
          us.active,
          us.immutable,
          (SELECT COUNT(id) FROM Users WHERE account = us.status) AS users
        FROM user_statuses us
        ORDER BY us.status ASC
      `);

      return res.status(200).json(statuses);
    } catch (error) {
      handleError(res, req, error, 'Error al listar estatus');
    }
  };

  createStatus = async (req, res) => {
    const transaction = await db.transaction();

    try {
      const {
        status,
        detail,
        color = '#8a8a8a',
        asignable = 'YES',
        active = 'YES'
      } = req.body || {};

      const normalizedStatus = String(status || '').trim().toUpperCase();
      const normalizedDetail = String(detail || '').trim();

      if (!normalizedStatus || !normalizedDetail) {
        await transaction.rollback();
        return res.status(400).json({ message: 'status y detail son obligatorios' });
      }

      if (!/^[A-Z0-9_-]+$/.test(normalizedStatus)) {
        await transaction.rollback();
        return res.status(400).json({ message: 'El status solo permite A-Z, 0-9, _ y -' });
      }

      if (!['YES', 'NO'].includes(asignable) || !['YES', 'NO'].includes(active)) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Valores inválidos para asignable o active' });
      }

      const existingStatus = await models.user_statuses.findOne({
        where: { status: normalizedStatus },
        transaction
      });

      if (existingStatus) {
        await transaction.rollback();
        return res.status(409).json({ message: 'Ya existe un estatus con ese nombre' });
      }

      const createdStatus = await models.user_statuses.create(
        {
          status: normalizedStatus,
          detail: normalizedDetail,
          color,
          asignable,
          active,
          immutable: false
        },
        { transaction }
      );

      await transaction.commit();

      await req.logAction({
        accion: 'Estatus creado',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `status=${createdStatus.status}`,
        type: 'info'
      });

      return res.status(201).json({
        id: createdStatus.id,
        status: createdStatus.status,
        detail: createdStatus.detail,
        color: createdStatus.color,
        asignable: createdStatus.asignable,
        active: createdStatus.active,
        immutable: createdStatus.immutable,
        users: 0
      });
    } catch (error) {
      handleError(res, req, error, 'Error al crear estatus', transaction);
    }
  };

  updateStatus = async (req, res) => {
    const transaction = await db.transaction();

    try {
      const statusId = Number(req.params.id);
      const { status, detail, color, asignable, active } = req.body || {};

      if (!statusId) {
        await transaction.rollback();
        return res.status(400).json({ message: 'ID de estatus inválido' });
      }

      const statusRecord = await models.user_statuses.findByPk(statusId, { transaction });
      if (!statusRecord) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Estatus no encontrado' });
      }

      if (statusRecord.immutable) {
        await transaction.rollback();
        return res.status(403).json({ message: 'No se puede modificar un estatus protegido del sistema' });
      }

      const nextStatus = String(status || statusRecord.status).trim().toUpperCase();
      const nextDetail = String(detail ?? statusRecord.detail).trim();

      if (!nextStatus || !nextDetail) {
        await transaction.rollback();
        return res.status(400).json({ message: 'status y detail son obligatorios' });
      }

      if (!/^[A-Z0-9_-]+$/.test(nextStatus)) {
        await transaction.rollback();
        return res.status(400).json({ message: 'El status solo permite A-Z, 0-9, _ y -' });
      }

      if (asignable && !['YES', 'NO'].includes(asignable)) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Valor inválido para asignable' });
      }

      if (active && !['YES', 'NO'].includes(active)) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Valor inválido para active' });
      }

      const oldStatus = statusRecord.status;
      const statusChanged = oldStatus !== nextStatus;

      if (statusChanged) {
        const duplicated = await models.user_statuses.findOne({
          where: { status: nextStatus },
          transaction
        });

        if (duplicated) {
          await transaction.rollback();
          return res.status(409).json({ message: 'Ya existe un estatus con ese nombre' });
        }
      }

      statusRecord.status = nextStatus;
      statusRecord.detail = nextDetail;
      statusRecord.color = color || statusRecord.color;
      statusRecord.asignable = asignable || statusRecord.asignable;
      statusRecord.active = active || statusRecord.active;
      await statusRecord.save({ transaction });

      if (statusChanged) {
        await models.Users.update(
          { account: nextStatus },
          { where: { account: oldStatus }, transaction }
        );

        const historyModel = models.user_status_history || models['user_status_history'];
        if (historyModel) {
          await historyModel.update(
            { old_status: nextStatus },
            { where: { old_status: oldStatus }, transaction }
          );

          await historyModel.update(
            { new_status: nextStatus },
            { where: { new_status: oldStatus }, transaction }
          );
        }
      }

      await transaction.commit();

      await req.logAction({
        accion: 'Estatus actualizado',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `id=${statusId}; oldStatus=${oldStatus}; newStatus=${nextStatus}`,
        type: 'info'
      });

      return res.status(200).json({
        id: statusRecord.id,
        status: statusRecord.status,
        detail: statusRecord.detail,
        color: statusRecord.color,
        asignable: statusRecord.asignable,
        active: statusRecord.active,
        immutable: statusRecord.immutable
      });
    } catch (error) {
      handleError(res, req, error, 'Error al actualizar estatus', transaction);
    }
  };

  deleteStatus = async (req, res) => {
    const transaction = await db.transaction();

    try {
      const statusId = Number(req.params.id);

      if (!statusId) {
        await transaction.rollback();
        return res.status(400).json({ message: 'ID de estatus inválido' });
      }

      const statusRecord = await models.user_statuses.findByPk(statusId, { transaction });
      if (!statusRecord) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Estatus no encontrado' });
      }

      if (statusRecord.immutable) {
        await transaction.rollback();
        return res.status(403).json({ message: 'No se puede eliminar un estatus protegido del sistema' });
      }

      const usersUsingStatus = await models.Users.count({
        where: { account: statusRecord.status },
        transaction
      });

      if (usersUsingStatus > 0) {
        await transaction.rollback();
        return res.status(400).json({ message: 'No se puede eliminar: hay usuarios usando este estatus' });
      }

      await statusRecord.destroy({ transaction });
      await transaction.commit();

      await req.logAction({
        accion: 'Estatus eliminado',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `id=${statusId}; status=${statusRecord.status}`,
        type: 'info'
      });

      return res.status(200).json({ message: 'Estatus eliminado correctamente' });
    } catch (error) {
      handleError(res, req, error, 'Error al eliminar estatus', transaction);
    }
  };
}

const ctrlStatus = new StatusController();
export { ctrlStatus };
