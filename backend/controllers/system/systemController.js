import os from 'os';
import { Op } from 'sequelize';
import { db, models } from '../../models/index.js';
import handleError from '../../handlers/handleError.js';

class SystemController {
	getPublicSettings = async (req, res) => {
		try {
			const queryKeys = String(req.query?.keys || '')
				.split(',')
				.map((key) => key.trim().toLowerCase())
				.filter((key) => key.length > 0 && /^[a-z0-9._-]+$/.test(key));

			const where = {
				active: true,
				visibility: 'public'
			};

			if (queryKeys.length > 0) {
				where.key = { [Op.in]: queryKeys };
			}

			const settings = await models.system.findAll({
				where,
				attributes: ['key', 'name', 'category', 'valueType', 'value'],
				order: [['category', 'ASC'], ['key', 'ASC']]
			});

			const config = settings.reduce((acc, item) => {
				acc[item.key] = item.value;
				return acc;
			}, {});

			await req.logAction({
				accion: 'Configuracion publica consultada',
				apartado: 'System',
				userId: req.user?.id,
				username: req.user?.username,
				valor: `keys=${queryKeys.length || settings.length}`,
				type: 'info'
			});

			return res.status(200).json({ settings, config });
		} catch (_error) {
			return res.status(500).json({ message: 'Error interno del servidor' });
		}
	};

	getSettings = async (req, res) => {
		try {
			const settings = await models.system.findAll({
				order: [['category', 'ASC'], ['key', 'ASC']]
			});

			await req.logAction({
				accion: 'Configuracion del sistema consultada',
				apartado: 'System',
				userId: req.user?.id,
				username: req.user?.username,
				valor: `settings=${settings.length}`,
				type: 'info'
			});

			return res.status(200).json({ settings });
		} catch (error) {
			handleError(res, req, error, 'Error al cargar configuraciones del sistema');
		}
	};

	updateSettings = async (req, res) => {
		try {
			const updates = Array.isArray(req.body?.settings) ? req.body.settings : [];
			if (updates.length === 0) {
				return res.status(400).json({ message: 'No se recibieron configuraciones para actualizar.' });
			}

			const normalizedUpdates = updates.reduce((acc, setting) => {
				const key = String(setting?.key || '').trim().toLowerCase();
				if (!key) return acc;
				acc.set(key, setting);
				return acc;
			}, new Map());

			const keys = Array.from(normalizedUpdates.keys());
			if (keys.length > 0) {
				const rows = await models.system.findAll({
					where: {
						key: { [Op.in]: keys },
						editable: true
					}
				});

				await Promise.all(rows.map(async (row) => {
					const update = normalizedUpdates.get(String(row.key || '').toLowerCase());
					if (!update) return;

					if ('value' in update) row.value = update.value;
					if ('active' in update) row.active = Boolean(update.active);
					await row.save();
				}));
			}

			await req.logAction({
				accion: 'Configuracion del sistema actualizada',
				apartado: 'System',
				userId: req.user?.id,
				username: req.user?.username,
				valor: `updates=${updates.length}`,
				type: 'info'
			});

			return res.status(200).json({ message: 'Configuraciones actualizadas correctamente.' });
		} catch (error) {
			handleError(res, req, error, 'Error al actualizar configuraciones del sistema');
		}
	};

	getHealth = async (req, res) => {
		try {
			await req.logAction({
				accion: 'Healthcheck consultado',
				apartado: 'System',
				userId: req.user?.id,
				username: req.user?.username,
				type: 'info'
			});
			return res.status(200).json({
				status: 'ok',
				service: 'system',
				timestamp: new Date().toISOString(),
				host: os.hostname(),
				uptime: process.uptime()
			});
		} catch (error) {
			handleError(res, req, error, 'Error al obtener health del sistema');
		}
	};

}

const ctrlSystem = new SystemController();
export { ctrlSystem };

