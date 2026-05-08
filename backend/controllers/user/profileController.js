
import { db } from '../../models/index.js';
import generateDeviceHash from '../../utils/generateDeviceHash.js';
import handleError from '../../handlers/handleError.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { models } from '../../models/index.js';
import { getEquippedEmblemsByUser } from '../../helpers/getEquippedEmblems.js';

function generateVerifyCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerifyMail(to, code, type = 'email') {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'login',
            user: process.env.DANNBOT_MAIL_USER,
            pass: process.env.DANNBOT_MAIL_PASS,
        },
    });
    const subject = type === 'username' ? 'Verifica tu nuevo usuario' : 'Verifica tu nuevo correo';
    const html = `<p>Tu código de verificación es: <b>${code}</b></p>`;
    await transporter.sendMail({
        from: `Tierra de Todos <${process.env.DANNBOT_MAIL_USER}>`,
        to,
        subject,
        html,
    });
}

class ProfileController {
    // PATCH /profile/email
    requestEmailChange = async (req, res) => {
        try {
            const userId = req.user.id;
            const { newEmail } = req.body;
            if (!newEmail || typeof newEmail !== 'string') {
                return res.status(400).json({ message: 'Correo invÃ¡lido' });
            }
            // Verifica que no exista ya ese correo
            const exists = await models.Users.findOne({ where: { email: newEmail } });
            if (exists) {
                return res.status(409).json({ message: 'Ese correo ya estÃ¡ en uso' });
            }
            // Genera cÃ³digo y guarda en user_mails
            const verifyCode = generateVerifyCode();
            const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
            await models.UserMails.create({ userId, newEmail, verifyCode, expiresAt });
            await sendVerifyMail(newEmail, verifyCode, 'email');
            await req.logAction({
                accion: 'Solicitud de cambio de correo iniciada',
                apartado: 'Perfil',
                userId,
                username: req.user?.username,
                valor: `newEmail=${newEmail}`,
                type: 'info'
            });
            return res.json({ message: 'Se enviÃ³ un cÃ³digo de verificaciÃ³n al nuevo correo' });
        } catch (err) {
            return handleError(res, req, err, 'Error al iniciar cambio de correo');
        }
    };

    // PATCH /profile/username
    requestUsernameChange = async (req, res) => {
        try {
            const userId = req.user.id;
            const { newUsername } = req.body;
            if (!newUsername || typeof newUsername !== 'string') {
                return res.status(400).json({ message: 'Usuario invÃ¡lido' });
            }
            // Verifica que no exista ya ese username
            const exists = await models.Users.findOne({ where: { username: newUsername } });
            if (exists) {
                return res.status(409).json({ message: 'Ese usuario ya estÃ¡ en uso' });
            }
            // Validar que solo se pueda cambiar cada 3 meses
            const lastChange = await models.UserUsernames.findOne({
                where: { userId, verified: true },
                order: [['updatedAt', 'DESC']]
            });
            if (lastChange) {
                const lastDate = new Date(lastChange.updatedAt);
                const now = new Date();
                const diffMonths = (now.getFullYear() - lastDate.getFullYear()) * 12 + (now.getMonth() - lastDate.getMonth());
                if (diffMonths < 3) {
                    return res.status(429).json({ message: 'Solo puedes cambiar tu usuario una vez cada 3 meses.' });
                }
            }
            // Aplica el cambio directamente (sin cÃ³digo)
            await models.Users.update({ username: newUsername }, { where: { id: userId } });
            await models.UserUsernames.create({ userId, newUsername, verifyCode: null, expiresAt: null, verified: true });
            await req.logAction({
                accion: 'Username actualizado correctamente',
                apartado: 'Perfil',
                userId,
                username: req.user?.username,
                valor: `newUsername=${newUsername}`,
                type: 'info'
            });
            return res.json({ message: 'Usuario actualizado correctamente' });
        } catch (err) {
            return handleError(res, req, err, 'Error al cambiar el usuario');
        }
    };

    // POST /profile/verify-change
    verifyProfileChange = async (req, res) => {
        try {
            const userId = req.user.id;
            const { code, type } = req.body;
            if (!code || !type) return res.status(400).json({ message: 'Faltan datos' });
            if (type === 'email') {
                const pending = await models.UserMails.findOne({ where: { userId, verifyCode: code, verified: false, expiresAt: { [models.Sequelize.Op.gt]: new Date() } } });
                if (!pending) return res.status(400).json({ message: 'CÃ³digo invÃ¡lido o expirado' });
                // Actualiza el correo real
                await models.Users.update({ email: pending.newEmail }, { where: { id: userId } });
                pending.verified = true;
                await pending.save();
                await req.logAction({
                    accion: 'Correo actualizado correctamente',
                    apartado: 'Perfil',
                    userId,
                    username: req.user?.username,
                    valor: `newEmail=${pending.newEmail}`,
                    type: 'info'
                });
                return res.json({ message: 'Correo actualizado correctamente' });
            } else {
                return res.status(400).json({ message: 'Tipo invÃ¡lido' });
            }
        } catch (err) {
            return handleError(res, req, err, 'Error al verificar el cambio');
        }
    };
  profile = async (req, res) => {
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
                u.folio,
                u.role,
                (SELECT r.color FROM Roles r WHERE r.role = u.role AND r.active = 'YES' LIMIT 1) AS roleColor,
                (SELECT r.complementary FROM Roles r WHERE r.role = u.role AND r.active = 'YES' LIMIT 1) AS roleComplementary,
                (SELECT r.enfasis FROM Roles r WHERE r.role = u.role AND r.active = 'YES' LIMIT 1) AS roleEnfasis,
                (SELECT r.extra FROM Roles r WHERE r.role = u.role AND r.active = 'YES' LIMIT 1) AS roleExtra,
                u.email,
                u.uuid,
                ? AS country,
                u.createdAt,
                u.updatedAt,
                u.mojang,
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
                u.account as status,
                (SELECT us.color FROM system_statuses us WHERE us.status = u.account AND us.active = 'YES' LIMIT 1) AS statusColor,
                (SELECT reason FROM user_status_history WHERE user = u.id ORDER BY created_at DESC LIMIT 1) AS status_reason,
                (SELECT u2.username FROM user_status_history sh
                    INNER JOIN Users u2 on u2.id = sh.changed_by
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
            FROM Users u
            LEFT JOIN user_devices ud ON ud.user = u.id
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
        result.equippedEmblems = await getEquippedEmblemsByUser(user);
        await req.logAction({
            accion: 'Perfil consultado',
            apartado: 'Perfil',
            userId: req.user?.id,
            username: req.user?.username,
            valor: `devices=${result.devices.length}; hasEmblems=${result.equippedEmblems.length}`,
            type: 'info'
        });
        return res.json({ user: result });

    } catch (error) {
        console.error("PROFILE ERROR:", error);
        await req.logAction({
            accion: `Error al cargar el perfil: ${error.message}`,
            apartado: "Perfil",
            type: 'error'
        });
        return res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
  };

    // DELETE /profile/devices/:id
    revokeDevice = async (req, res) => {
        try {
            const userId = req.user.id;
            const deviceId = parseInt(req.params.id, 10);

            if (!deviceId || Number.isNaN(deviceId)) {
                return res.status(400).json({ message: 'ID de dispositivo inválido' });
            }

            const device = await models.UserDevices.findOne({
                where: { id: deviceId, user: userId }
            });

            if (!device) {
                return res.status(404).json({ message: 'Dispositivo no encontrado' });
            }

            const isCurrent = device.device_hash === req.device?.hash;

            await models.Sessions.update(
                { revoked: true },
                { where: { userId, device: device.device_hash, revoked: false } }
            );

            await req.logAction({
                accion: 'Sesión de dispositivo revocada',
                apartado: 'Perfil',
                userId,
                username: req.user.username,
                valor: `deviceId=${deviceId}; isCurrent=${isCurrent}`,
                type: 'info'
            });

            if (isCurrent) {
                return res.status(200).json({ message: 'Sesión cerrada correctamente', redirectToLogin: true });
            }

            return res.status(200).json({ message: 'Sesión cerrada correctamente en ese dispositivo', redirectToLogin: false });
        } catch (error) {
            return handleError(res, error, req, 'Error al revocar dispositivo', 'Perfil');
        }
    };
}

const ctrlProfile = new ProfileController();
export { ctrlProfile };
