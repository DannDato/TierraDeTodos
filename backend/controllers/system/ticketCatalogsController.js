import { models } from '../../models/index.js';

class TicketCatalogsController {
  catalogs = async (req, res) => {
    try {
      const [types, priorities] = await Promise.all([
        models.ticket_types.findAll({
          where: { active: 'YES' },
          attributes: ['id', 'key', 'name', 'detail', 'color'],
          order: [['name', 'ASC'], ['id', 'ASC']]
        }),
        models.tickets_prioritys.findAll({
          where: { active: 'YES' },
          attributes: ['id', 'key', 'name', 'detail', 'color'],
          order: [['name', 'ASC'], ['id', 'ASC']]
        })
      ]);

      return res.status(200).json({
        types,
        priorities
      });
    } catch (error) {
      console.error('TICKET CATALOGS ERROR:', error);

      await req.logAction({
        accion: `Error al cargar catálogos de tickets: ${error.message}`,
        apartado: 'System',
        type: 'error'
      });

      return res.status(500).json({
        message: 'Error interno del servidor'
      });
    }
  };
}

const ctrlTicketCatalogs = new TicketCatalogsController();
export { ctrlTicketCatalogs };
