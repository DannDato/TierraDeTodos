
import { db } from '../../models/index.js';
import generateDeviceHash from '../../utils/generateDeviceHash.js';

export const profile = async (req, res) => {
    try {
        const user = req.user.id;
        const hashDevice = generateDeviceHash(req);        
        let ip = req.ip || req.headers['x-forwarded-for'];
        if(process.env.NODE_ENV === 'development'){ip='148.202.104.78';} 
        const response = await fetch(`http://ip-api.com/json/${ip}`);
        const data = await response.json();
        const country = data.countryCode;
        const userData = await db.query(`
            SELECT 
                u.username,
                u.rol,
                u.email,
                u.uuid,
                ? AS country,
                u.createdAt,
                u.updatedAt,
                u.mojang,
                u.account as status,
                (SELECT reason FROM user_status_history WHERE user = u.id ORDER BY created_at DESC LIMIT 1) AS status_reason,
                (SELECT u2.username FROM user_status_history sh
                    INNER JOIN users u2 on u2.id = sh.changed_by
                    WHERE sh.user = u.id ORDER BY sh.created_at DESC LIMIT 1
                ) AS status_changed_by,
                (SELECT created_at FROM user_status_history WHERE user = u.id ORDER BY created_at DESC LIMIT 1) AS status_changed_at,
                IFNULL(
                    CONCAT(
                        '[',
                        GROUP_CONCAT(
                            JSON_OBJECT(
                                'id', ud.id,
                                'device_hash', ud.device_hash,
                                'authorized', ud.authorized,
                                'device', IF(ud.user_agent LIKE '%Mobile%', 'Mobile ~ Android/iOS', 'Desktop ~ Chrome/Firefox/Edge'),
                                'ip', ud.ip_address,
                                'lastActive', ud.last_login,
                                'isCurrent', ud.device_hash = ?
                            )
                        ),
                        ']'
                    ),
                    '[]'
                ) AS devices
            FROM users u
            LEFT JOIN userdevices ud ON ud.user = u.id
            WHERE u.id = ?
            GROUP BY u.id;
        `, {
            replacements:[country,
                hashDevice,
                user
            ],
            type: db.QueryTypes.SELECT
        });


        const result = userData[0];
        result.devices = result.devices ? JSON.parse(result.devices) : [];

        await req.logAction({
            accion: "Perfil cargado",
            apartado: "Perfil",
        });
        return res.json({ user: result });

    } catch (error) {
        console.error("PROFILE ERROR:", error);
        await req.logAction({
            accion: error.message,
            apartado: "Perfil",
            type: 'error'
        });
        return res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
};