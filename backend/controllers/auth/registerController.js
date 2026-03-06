
import { models, db } from '../../models/index.js';
import { Op } from 'sequelize';
import generateDeviceHash from '../../utils/generateDeviceHash.js';
import { createAccessCode } from '../../helpers/createCodes.js';
import { applyRolePresetPermissions } from '../../helpers/applyRolePresetPermissions.js';
import bcrypt from 'bcrypt';

export const register = async (req, res) => {
    const { email, password, username } = req.body;

    const transaction = await db.transaction();

    try {

        if (!email || !password || !username) {
            return res.status(400).json({ message: 'Datos incompletos' });
        }

        const existingUser = await models.Users.findOne({
            where: {
                [Op.or]: [{ email }, { username }]
            },
            transaction
        });

        if (existingUser) {
            await transaction.rollback();
            return res.status(400).json({ message: 'El usuario ya existe' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await models.Users.create({
            email,
            username,
            password: hashedPassword,
            rol: "USER"
        }, { transaction });

        await applyRolePresetPermissions({
            userId: newUser.id,
            role: newUser.rol,
            transaction
        });

        const deviceHash = generateDeviceHash(req);

        await models.UserDevices.create({
            user: newUser.id,
            device_hash: deviceHash,
            user_agent: req.headers['user-agent'],
            ip_address: req.ip,
            authorized: "PENDING"
        }, { transaction });

        const SendAccess = await createAccessCode(newUser, deviceHash, req, res);
        if (!SendAccess) {throw new Error("No se pudo crear el código de acceso");}

        await transaction.commit();

        return res.status(201).json({
            type: "new_device",
            message: 'Registro exitoso. Se ha enviado un código de verificación a tu correo.'
        });

    } catch (error) {

        await transaction.rollback();

        console.error("REGISTER ERROR:", error);

        await req.logAction({
            accion: error.message,
            apartado: "Register",
            type: 'error'
        });

        return res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
};