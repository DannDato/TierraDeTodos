import os from 'os';
import { Op, QueryTypes } from 'sequelize';
import { db, models } from '../../models/index.js';
import handleError from '../../handlers/handleError.js';

class SystemController {
	getPublicStreamers = async (req, res) => {
		try {
			const rows = await db.query(`
				SELECT
					u.id,
					u.username,
					u.displayName,
					u.role,
					sp.platform,
					sp.username AS channelUsername,
					COALESCE(NULLIF(sp.link, ''), CASE
						WHEN UPPER(u.role) IN ('SUPER-ADMIN', 'ADMIN', 'MOD', 'MODERATOR') THEN NULLIF(ui.value, '')
						ELSE NULL
					END) AS link,
					sp.image AS streamerImage,
					upi.img AS profileImage,
					c.id AS communityId,
					c.name AS communityName,
					c.logo_url AS communityLogo
				FROM Users u
				LEFT JOIN streamer sp ON sp.userID = u.id
				LEFT JOIN community c ON c.lider = u.id
				LEFT JOIN information_fields inf ON inf.key = 'website' AND inf.enabled = 1
				LEFT JOIN user_information ui ON ui.userId = u.id AND ui.fieldId = inf.id
				LEFT JOIN user_profile_images upi ON upi.userId = u.id
				WHERE u.account = 'ACTIVE'
				  AND UPPER(u.role) IN ('SUPER-ADMIN', 'ADMIN', 'MOD', 'MODERATOR', 'STREAMER')
				  AND (UPPER(u.role) <> 'STREAMER' OR c.id IS NOT NULL)
				ORDER BY
					CASE WHEN LOWER(u.username) = 'danndato' THEN 0
						 WHEN UPPER(u.role) IN ('SUPER-ADMIN', 'ADMIN') THEN 1
						 WHEN UPPER(u.role) IN ('MOD', 'MODERATOR') THEN 2
						 ELSE 3 END,
					LOWER(COALESCE(u.displayName, u.username)) ASC,
					u.id ASC
			`, { type: QueryTypes.SELECT });

			const participants = rows.reduce((result, row) => {
				if (result.some((item) => item.id === row.id)) return result;
				const role = String(row.role || '').toUpperCase();
				const category = row.username?.toLowerCase() === 'danndato'
					? 'DANNDATO'
					: ['SUPER-ADMIN', 'ADMIN'].includes(role) ? 'ADMINS'
						: ['MOD', 'MODERATOR'].includes(role) ? 'MOD' : 'STREAMER';
				result.push({
					id: row.id,
					username: row.username,
					displayName: row.displayName || row.username,
					role: row.role,
					category,
					platform: row.platform || null,
					channelUsername: row.channelUsername || row.username,
					link: row.link || null,
					image: row.streamerImage || row.profileImage || row.communityLogo || null,
					community: row.communityId ? { id: row.communityId, name: row.communityName } : null,
				});
				return result;
			}, []);

			return res.status(200).json({ participants });
		} catch (error) {
			return handleError(res, req, error, 'Error al obtener participantes públicos');
		}
	};

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
				let value = item.value;
				if (['json', 'array'].includes(item.valueType) && typeof value === 'string') {
					try { value = JSON.parse(value); } catch { /* conserva el valor original */ }
				}
				acc[item.key] = value;
				return acc;
			}, {});

			const normalizedSettings = settings.map((item) => ({
				...item.toJSON(),
				value: config[item.key],
			}));

			await req.logAction({
				accion: 'Configuracion publica consultada',
				apartado: 'System',
				userId: req.user?.id,
				username: req.user?.username,
				valor: `keys=${queryKeys.length || settings.length}`,
				type: 'info'
			});

			return res.status(200).json({ settings: normalizedSettings, config });
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

