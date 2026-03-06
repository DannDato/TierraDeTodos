import jwt from 'jsonwebtoken';
import { models } from '../../models/index.js';
import { Op } from 'sequelize';
import generateDeviceHash from '../../utils/generateDeviceHash.js';
import { verifyAccessCode } from '../../helpers/verifyCodes.js';

export const verifyAccess = async (req, res) => {
    const { codigo, usuario } = req.body;
    try {
        if (!codigo || !usuario) {
            await req.logAction({
                accion: "Verificación de dispositivo fallida - datos incompletos",
                apartado: "VerifyAccess",
                query:"select",
                condicion:"username/email lookup",
                valor:usuario,
                type:"warn"
            });
            return res.status(400).json({ message: 'Datos incompletos' });
        }

        const user = await models.Users.findOne({
            where: {
                [Op.or]: [
                    { username: usuario },
                    { email: usuario }
                ]
            }
        });
        if (!user) {
            await req.logAction({
                accion: "Verificación de dispositivo fallida - usuario no encontrado",
                apartado: "VerifyAccess",
                tabla: "Users",
                condicion: "username/email lookup",
                valor: usuario
            });
            return res.status(400).json({ message: 'Usuario no encontrado' });
        }
        const now = Date.now();
        const windowTime = new Date(now - 5 * 60 * 1000);
        const userAttempts = await models.Attempts.count({
            where: {
                user: user.id,
                action_type: 'VERIFY-DEVICE',
                status: 'FAILED',
                createdAt: { [Op.gte]: windowTime }
            }
        });
        if (userAttempts >= 5) {
            await req.logAction({
                accion: "Cuenta bloqueada - múltiples intentos de verificación de dispositivo",
                apartado: "VerifyAccess",
                userId: user.id,
                username: user.username,
                type:"warn"
            });
            return res.status(429).json({
                message: 'Acceso bloqueado temporalmente. Intenta más tarde.'
            });
        }

        const deviceHash = generateDeviceHash(req);
        const verificationResult = await verifyAccessCode(user, deviceHash, codigo, req, res);
        if(verificationResult.type === "error") {
            return res.status(400).json({ message: verificationResult.message });
        }

        // Código de verificación válido, generar token JWT
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        return res.json({ token });
    } catch (error) {
        console.error("VERIFY ACCESS ERROR:", error);
        await req.logAction({
            accion: error.message,
            apartado: "VerifyAccess",
            type: 'error'
        });
        return res.status(500).json({
            message: `Error interno del servidor`
        });
    }
}
