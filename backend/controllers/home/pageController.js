import { models } from '../../models/index.js';
import { Op } from 'sequelize';

class PageController {
	getLatestNews = async (_req, res) => {
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

			return res.status(200).json({
				news: newsRows
			});
		} catch (_error) {
			return res.status(500).json({
				message: 'Error interno del servidor'
			});
		}
	};

	getActiveEditionRules = async (_req, res) => {
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

			return res.status(200).json({
				edition: activeEdition,
				rules: ruleRows
			});
		} catch (error) {
			return res.status(500).json({
				message: 'Error interno del servidor'
			});
		}
	};

	getActiveEditionTimeline = async (_req, res) => {
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

			return res.status(200).json({
				edition: activeEdition,
				timeline: timelineRows
			});
		} catch (error) {
			return res.status(500).json({
				message: 'Error interno del servidor'
			});
		}
	};
}

const ctrlPage = new PageController();
export { ctrlPage };
