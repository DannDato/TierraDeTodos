import { models } from '../../models/index.js';
import { Op } from 'sequelize';
import handleError from '../../handlers/handleError.js';

class PageController {
	getLatestNews = async (req, res) => {
		try {
			const minDate = new Date();
			minDate.setMonth(minDate.getMonth() - 4);

			const newsRows = await models.news.findAll({
				where: {
					fecha: {
						[Op.gte]: minDate.toISOString().slice(0, 10)
					}
				},
				order: [['fecha', 'DESC'], ['id', 'DESC']],
				limit: 3,
				attributes: ['id', 'type', 'title', 'fecha', 'description', 'image', 'Reporter']
			});

			await req.logAction({
				accion: 'Noticias publicas consultadas',
				apartado: 'Home',
				userId: req.user?.id,
				username: req.user?.username,
				valor: `news=${newsRows.length}`,
				type: 'info'
			});

			return res.status(200).json({
				news: newsRows
			});
		} catch (error) {
			return handleError(res, req, error, 'Error al obtener noticias publicas');
		}
	};

	getActiveEditionRules = async (req, res) => {
		try {
			const activeEdition = await models.Edition.findOne({
				where: { status: 'ACTIVE' },
				attributes: ['id', 'name', 'number', 'color', 'status', 'date_start', 'date_end'],
				order: [['id', 'DESC']]
			});

			if (!activeEdition) {
				return res.status(200).json({
					edition: null,
					rules: []
				});
			}

			const ruleRows = await models.EditionRules.findAll({
				where: {
					editionId: activeEdition.id,
					active: 'YES'
				},
				attributes: ['id', 'editionId', 'category', 'item', 'icon', 'color', 'sortOrder'],
				order: [['sortOrder', 'ASC'], ['id', 'ASC']]
			});

			await req.logAction({
				accion: 'Reglas de edicion activa consultadas',
				apartado: 'Home',
				userId: req.user?.id,
				username: req.user?.username,
				valor: `editionId=${activeEdition.id}; rules=${ruleRows.length}`,
				type: 'info'
			});

			return res.status(200).json({
				edition: activeEdition,
				rules: ruleRows
			});
		} catch (error) {
			return handleError(res, req, error, 'Error al obtener reglas de edicion activa');
		}
	};

	getActiveEditionTimeline = async (req, res) => {
		try {
			const activeEdition = await models.Edition.findOne({
				where: { status: 'ACTIVE' },
				attributes: ['id', 'name', 'number', 'color', 'status', 'date_start', 'date_end'],
				order: [['id', 'DESC']]
			});

			if (!activeEdition) {
				return res.status(200).json({
					edition: null,
					timeline: []
				});
			}

			const timelineRows = await models.EditionDates.findAll({
				where: {
					editionId: activeEdition.id,
					active: 'YES'
				},
				attributes: ['id', 'editionId', 'date', 'name', 'description', 'emoji', 'color'],
				order: [['date', 'ASC'], ['id', 'ASC']]
			});

			await req.logAction({
				accion: 'Timeline de edicion activa consultado',
				apartado: 'Home',
				userId: req.user?.id,
				username: req.user?.username,
				valor: `editionId=${activeEdition.id}; timeline=${timelineRows.length}`,
				type: 'info'
			});

			return res.status(200).json({
				edition: activeEdition,
				timeline: timelineRows
			});
		} catch (error) {
			return handleError(res, req, error, 'Error al obtener timeline de edicion activa');
		}
	};
}

const ctrlPage = new PageController();
export { ctrlPage };

