
import { db } from '../../models/index.js';
import generateDeviceHash from '../../utils/generateDeviceHash.js';
import handleError from '../../handlers/handleError.js';
import { addPublicCommunity, PUBLIC_COMMUNITY_FIELDS, PUBLIC_COMMUNITY_JOIN } from '../../helpers/publicCommunity.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { models } from '../../models/index.js';
import { getEquippedEmblemsByUser } from '../../helpers/getEquippedEmblems.js';
import { Op } from 'sequelize';
import saveLocation from '../../helpers/saveLocation.js';

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
    parseInformationValue = (field, value) => {
        if (value === null || value === undefined || value === '') return null;
        if (field.dataType === 'boolean') return value === true || value === 'true' ? 'true' : value === false || value === 'false' ? 'false' : undefined;
        return String(value);
    };

    validateInformationValue = (field, value) => {
        const normalized = this.parseInformationValue(field, value);
        if (normalized === undefined) return 'Debe ser un valor booleano válido';
        if (normalized === null) return field.required ? 'Este campo es obligatorio' : null;
        const options = field.options || {};
        if (field.maxLength && normalized.length > field.maxLength) return `No puede superar ${field.maxLength} caracteres`;
        if (field.dataType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return 'Ingresa un correo válido';
        if (field.dataType === 'url') {
            try { new URL(normalized); } catch { return 'Ingresa una URL válida'; }
        }
        if (field.dataType === 'number') {
            const number = Number(normalized);
            if (!Number.isFinite(number)) return 'Ingresa un número válido';
            if (options.min !== undefined && number < Number(options.min)) return `El valor mínimo es ${options.min}`;
            if (options.max !== undefined && number > Number(options.max)) return `El valor máximo es ${options.max}`;
        }
        if (field.dataType === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return 'Ingresa una fecha válida';
        if (field.dataType === 'select' && Array.isArray(options.choices) && !options.choices.includes(normalized)) return 'La opción seleccionada no es válida';
        return null;
    };

    serializeInformationValue = (field, value) => {
        if (value === null || value === undefined) return null;
        if (field.dataType === 'boolean') return value === 'true';
        if (field.dataType === 'number') return Number(value);
        return value;
    };

    getInformation = async (req, res) => {
        try {
            const fields = await models.InformationFields.findAll({
                where: { enabled: true },
                include: [{ model: models.UserInformation, as: 'values', where: { userId: req.user.id }, required: false, attributes: ['value'] }],
                order: [['order', 'ASC'], ['id', 'ASC']],
            });
            const information = fields.map((field) => {
                const plain = field.get({ plain: true });
                const stored = plain.values?.[0]?.value ?? null;
                delete plain.values;
                return { ...plain, value: this.serializeInformationValue(plain, stored) };
            });
            return res.json({ fields: information });
        } catch (error) {
            return handleError(res, req, error, 'Error al consultar información dinámica del perfil');
        }
    };

    updateInformation = async (req, res) => {
        let transaction;
        try {
            const values = req.body?.values;
            if (!values || typeof values !== 'object' || Array.isArray(values)) return res.status(400).json({ message: 'Formato de información inválido' });
            const fields = await models.InformationFields.findAll({ where: { enabled: true } });
            const fieldsByKey = new Map(fields.map((field) => [field.key, field]));
            const unknown = Object.keys(values).find((key) => !fieldsByKey.has(key));
            if (unknown) return res.status(400).json({ message: `El campo ${unknown} no está disponible` });

            for (const field of fields) {
                const error = this.validateInformationValue(field, values[field.key]);
                if (error) return res.status(400).json({ message: `${field.label}: ${error}`, field: field.key });
            }

            transaction = await db.transaction();
            for (const field of fields) {
                const normalized = this.parseInformationValue(field, values[field.key]);
                const existing = await models.UserInformation.findOne({ where: { userId: req.user.id, fieldId: field.id }, transaction });
                if (normalized === null) {
                    if (existing) await existing.destroy({ transaction });
                } else if (existing) {
                    await existing.update({ value: normalized }, { transaction });
                } else {
                    await models.UserInformation.create({ userId: req.user.id, fieldId: field.id, value: normalized }, { transaction });
                }
            }
            await transaction.commit();
            transaction = null;
            await req.logAction({ accion: 'Información dinámica del perfil actualizada', apartado: 'Perfil', userId: req.user.id, username: req.user.username, valor: `fields=${Object.keys(values).length}`, type: 'info' });
            return this.getInformation(req, res);
        } catch (error) {
            return handleError(res, req, error, 'Error al guardar información dinámica del perfil', transaction);
        }
    };

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
        if(process.env.NODE_ENV === 'production'){ip='148.202.104.78';}

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
                (SELECT country FROM user_locations ul WHERE ul.userId = u.id ORDER BY ul.id DESC LIMIT 1) AS country,
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
                ) AS devices,
                ${PUBLIC_COMMUNITY_FIELDS}
            FROM Users u
            LEFT JOIN user_devices ud ON ud.user = u.id
            ${PUBLIC_COMMUNITY_JOIN}
            WHERE u.id = ?
            GROUP BY u.id,
                community_visual.community_id,
                community_visual.community_name,
                community_visual.community_color,
                community_visual.community_color2,
                community_visual.community_flag_pattern,
                community_visual.community_emblem_url;
        `, {
            replacements:[
                hashDevice,
                user
            ],
            type: db.QueryTypes.SELECT
        });


        const result = userData[0];
        result.devices = result.devices ? JSON.parse(result.devices) : [];
        addPublicCommunity(result);
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
