import { models } from '../../models/index.js';

class TicketCatalogsController {
  catalogs = async (req, res) => {
    try {
      const [types, priorities] = await Promise.all([
        models.catalog.findAll({
          where: { category: 'ticket_type', active: 'YES' },
          attributes: ['id', 'key', 'name', 'detail', 'color'],
          order: [['sortOrder', 'ASC'], ['name', 'ASC']]
        }),
        models.catalog.findAll({
          where: { category: 'ticket_priority', active: 'YES' },
          attributes: ['id', 'key', 'name', 'detail', 'color'],
          order: [['sortOrder', 'ASC'], ['name', 'ASC']]
        })
      ]);

      await req.logAction({
        accion: 'Catalogos publicos de tickets consultados',
        apartado: 'System',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `types=${types.length}; priorities=${priorities.length}`,
        type: 'info'
      });

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

