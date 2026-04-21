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
				.filter(Boolean);

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

			return res.status(200).json({ settings, config });
		} catch (_error) {
			return res.status(500).json({ message: 'Error interno del servidor' });
		}
	};

	getSettings = async (_req, res) => {
		try {
			const settings = await models.system.findAll({
				order: [['category', 'ASC'], ['key', 'ASC']]
			});

			return res.status(200).json({ settings });
		} catch (error) {
			handleError(res, _req, error, 'Error al cargar configuraciones del sistema');
		}
	};

	updateSettings = async (req, res) => {
		try {
			const updates = Array.isArray(req.body?.settings) ? req.body.settings : [];
			if (updates.length === 0) {
				return res.status(400).json({ message: 'No se recibieron configuraciones para actualizar.' });
			}

			for (const setting of updates) {
				const key = String(setting?.key || '').trim().toLowerCase();
				if (!key) continue;

				const row = await models.system.findOne({ where: { key } });
				if (!row || !row.editable) continue;

				if ('value' in setting) row.value = setting.value;
				if ('active' in setting) row.active = Boolean(setting.active);
				await row.save();
			}

			return res.status(200).json({ message: 'Configuraciones actualizadas correctamente.' });
		} catch (error) {
			handleError(res, req, error, 'Error al actualizar configuraciones del sistema');
		}
	};

	getHealth = async (_req, res) => {
		try {
			return res.status(200).json({
				status: 'ok',
				service: 'system',
				timestamp: new Date().toISOString(),
				host: os.hostname(),
				uptime: process.uptime()
			});
		} catch (error) {
			handleError(res, _req, error, 'Error al obtener health del sistema');
		}
	};

}

const ctrlSystem = new SystemController();
export { ctrlSystem };
