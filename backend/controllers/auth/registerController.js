
import { models, db } from '../../models/index.js';
import { Op } from 'sequelize';
import generateDeviceHash from '../../utils/generateDeviceHash.js';
import { createAccessCode } from '../../helpers/createCodes.js';
import { applyRolePresetPermissions } from '../../helpers/applyRolePresetPermissions.js';
import { getActualEdition } from '../../utils/getEdition.js';
import bcrypt from 'bcrypt';

class RegisterController {
    buildUserFolio = (userId) => `TDT-${String(userId).padStart(8, '0')}`;

    ensureUserInActiveEdition = async ({ userId, source = 'REGISTER', transaction, editionId }) => {
        const effectiveEditionId = editionId || (await getActualEdition())?.id;
        if (!effectiveEditionId) return null;

        await models.UserEdition.findOrCreate({
            where: {
                editionId: effectiveEditionId,
                userID: userId
            },
            defaults: {
                source
            },
            transaction
        });

        return effectiveEditionId;
    };

  register = async (req, res) => {
    const { email, password, username } = req.body;
    let transaction = null;

    try {
        const actualEdition = await getActualEdition();
        if (!actualEdition) { return res.status(409).json({ message: 'No hay inscripciones activas en este momento' }); }

        if (!email || !password || !username) {
            return res.status(400).json({ message: 'Datos incompletos' });
        }

        const emailStr = String(email).trim();
        const usernameStr = String(username).trim();
        const passwordStr = String(password);

        const emailRegex = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{1,63}$/;
        if (!emailRegex.test(emailStr)) {
            return res.status(400).json({ message: 'Formato de email inválido' });
        }

        if (usernameStr.length < 3 || usernameStr.length > 30) {
            return res.status(400).json({ message: 'El nombre de usuario debe tener entre 3 y 30 caracteres' });
        }
        if (!/^[a-zA-Z0-9_.-]+$/.test(usernameStr)) {
            return res.status(400).json({ message: 'El nombre de usuario solo puede contener letras, números, guiones bajos, puntos y guiones' });
        }

        if (passwordStr.length < 8 || passwordStr.length > 128) {
            return res.status(400).json({ message: 'La contraseña debe tener entre 8 y 128 caracteres' });
        }

        transaction = await db.transaction();

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
            role: "USER"
        }, { transaction });

        const folio = this.buildUserFolio(newUser.id);
        await newUser.update({ folio }, { transaction });

        await applyRolePresetPermissions({
            userId: newUser.id,
            role: newUser.role,
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

        await this.ensureUserInActiveEdition({
            userId: newUser.id,
            source: 'REGISTER',
            editionId: actualEdition.id,
            transaction
        });

        await transaction.commit();
        transaction = null;

        await req.logAction({
            accion: 'Usuario registrado correctamente',
            apartado: 'Register',
            valor: `userId=${newUser.id}; username=${newUser.username}; editionId=${actualEdition.id}`,
            type: 'info'
        });

        return res.status(201).json({
            type: "new_device",
            message: 'Registro exitoso. Se ha enviado un código de verificación a tu correo.'
        });

    } catch (error) {

        if (transaction) {
            await transaction.rollback();
        }

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
}

const ctrlRegister = new RegisterController();
export { ctrlRegister };
