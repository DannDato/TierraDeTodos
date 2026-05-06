import { db } from '../../models/index.js';
import { getEquippedEmblemsByUsers } from '../../helpers/getEquippedEmblems.js';

class PlayersController {
  getRandomOrderClause = () => {
    const sortableFields = [
      'u.id',
      'u.username',
      'COALESCE(u.folio, "")',
      'u.role',
      'u.account',
      'u.createdAt'
    ];

    const randomDirection = () => (Math.random() > 0.5 ? 'ASC' : 'DESC');
    const firstIndex = Math.floor(Math.random() * sortableFields.length);
    let secondIndex = Math.floor(Math.random() * sortableFields.length);

    while (secondIndex === firstIndex && sortableFields.length > 1) {
      secondIndex = Math.floor(Math.random() * sortableFields.length);
    }

    const primaryField = sortableFields[firstIndex];
    const secondaryField = sortableFields[secondIndex];

    return `${primaryField} ${randomDirection()}, ${secondaryField} ${randomDirection()}, RAND()`;
  };

  players = async (req, res) => {
    try {
      const orderClause = this.getRandomOrderClause();

      const players = await db.query(
        `
          SELECT
            u.id,
            u.username,
            u.folio,
            u.role,
            (SELECT r.color FROM Roles r WHERE r.role = u.role AND r.active = 'YES' LIMIT 1) AS roleColor,
            (SELECT r.complementary FROM Roles r WHERE r.role = u.role AND r.active = 'YES' LIMIT 1) AS roleComplementary,
            (SELECT r.enfasis FROM Roles r WHERE r.role = u.role AND r.active = 'YES' LIMIT 1) AS roleEnfasis,
            (SELECT r.extra FROM Roles r WHERE r.role = u.role AND r.active = 'YES' LIMIT 1) AS roleExtra,
            'MX' AS country,
            u.createdAt,
            (
              SELECT upi.img
              FROM user_profile_images upi
              WHERE upi.userId = u.id
              ORDER BY upi.id DESC
              LIMIT 1
            ) AS avatarUrl,
            (
              SELECT upi.pos_x
              FROM user_profile_images upi
              WHERE upi.userId = u.id
              ORDER BY upi.id DESC
              LIMIT 1
            ) AS avatarPosX,
            (
              SELECT upi.pos_y
              FROM user_profile_images upi
              WHERE upi.userId = u.id
              ORDER BY upi.id DESC
              LIMIT 1
            ) AS avatarPosY,
            (
              SELECT upi.zoom
              FROM user_profile_images upi
              WHERE upi.userId = u.id
              ORDER BY upi.id DESC
              LIMIT 1
            ) AS avatarZoom,
            u.account AS status,
            (SELECT us.color FROM system_statuses us WHERE us.status = u.account AND us.active = 'YES' LIMIT 1) AS statusColor
          FROM Users u
          WHERE u.account <> 'INACTIVE'
            AND EXISTS (
              SELECT 1
              FROM user_editions ue
              INNER JOIN edition e ON e.id = ue.editionId
              WHERE ue.userID = u.id
                AND e.status = 'ACTIVE'
            )
          ORDER BY ${orderClause};
        `,
        { type: db.QueryTypes.SELECT }
      );

      const equippedEmblemsByUserId = await getEquippedEmblemsByUsers(players.map((player) => player.id));

      for (const player of players) {
        player.equippedEmblems = equippedEmblemsByUserId.get(Number(player.id)) || [];
      }

      await req.logAction({
        accion: 'Listado de jugadores consultado',
        apartado: 'Players',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `players=${players.length}`,
        type: 'info'
      });

      return res.json({ players });
    } catch (error) {
      console.error('PLAYERS ERROR:', error);
      await req.logAction({
        accion: `Error al cargar jugadores: ${error.message}`,
        apartado: 'Players',
        type: 'error'
      });

      return res.status(500).json({
        message: 'Error interno del servidor'
      });
    }
  };
}

const ctrlPlayers = new PlayersController();
export { ctrlPlayers };

