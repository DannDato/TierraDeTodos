import { db } from '../../models/index.js';

class CredentialController {
  credential = async (req, res) => {
    try {
      const userId = req.user?.id;
      let ip = req.ip || req.headers['x-forwarded-for'];

      if (process.env.NODE_ENV === 'development') {
        ip = '148.202.104.78';
      }

      const response = await fetch(`http://ip-api.com/json/${ip}`);
      const data = await response.json();
      const country = data.countryCode;

      const userData = await db.query(
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
            ? AS country,
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
            (SELECT us.color FROM user_statuses us WHERE us.status = u.account AND us.active = 'YES' LIMIT 1) AS statusColor
          FROM Users u
          WHERE u.id = ?
          LIMIT 1;
        `,
        {
          replacements: [country, userId],
          type: db.QueryTypes.SELECT
        }
      );

      return res.json({ user: userData[0] || null });
    } catch (error) {
      console.error('CREDENTIAL ERROR:', error);
      await req.logAction({
        accion: `Error al cargar la credencial: ${error.message}`,
        apartado: 'Credencial',
        type: 'error'
      });

      return res.status(500).json({
        message: 'Error interno del servidor'
      });
    }
  };
}

const ctrlCredential = new CredentialController();
export { ctrlCredential };
