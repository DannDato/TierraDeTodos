import jwt from 'jsonwebtoken';
import { models } from '../../models/index.js';
import { Op } from 'sequelize';
import generateDeviceHash from '../../utils/generateDeviceHash.js';
import { verifyAccessCode } from '../../helpers/verifyCodes.js';
import { sendAccessCodeEmail } from '../../helpers/createCodes.js';
import { CreateSession } from '../../helpers/CreateSession.js';

class VerifyController {
  verifyAccess = async (req, res) => {
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
                userId: user.id,
                username: user.username,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        await CreateSession({
            token,
            userId: user.id,
            req
        });
        let jsonResponse={
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        }
        return res.json(jsonResponse);
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
  };

  resendAccessCode = async (req, res) => {
    const { usuario } = req.body;

    try {
        if (!usuario) {
            return res.status(400).json({ message: 'Usuario requerido' });
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
                accion: "Reenvío de código fallido - usuario no encontrado",
                apartado: "VerifyAccess",
                tabla: "Users",
                condicion: "username/email lookup",
                valor: usuario,
                type: "warn"
            });
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const deviceHash = generateDeviceHash(req);
        const activeCode = await models.AccessCodes.findOne({
            where: {
                user: user.id,
                device_hash: deviceHash,
                is_used: 'UNUSED',
                expires_at: {
                    [Op.gt]: new Date()
                }
            },
            order: [['expires_at', 'DESC'], ['id', 'DESC']]
        });

        if (!activeCode) {
            await req.logAction({
                accion: "Reenvío de código fallido - sin código activo",
                apartado: "VerifyAccess",
                userId: user.id,
                username: user.username,
                valor: `deviceHash=${deviceHash}`,
                type: "warn"
            });
            return res.status(404).json({ message: 'No hay un código activo para reenviar. Vuelve a iniciar sesión.' });
        }

        const emailSent = await sendAccessCodeEmail({
            user,
            code: String(activeCode.codigo),
            req,
            apartado: 'VerifyAccess'
        });

        if (!emailSent) {
            return res.status(500).json({ message: 'No se pudo reenviar el código' });
        }

        return res.status(200).json({ message: 'Código reenviado correctamente' });
    } catch (error) {
        console.error("RESEND VERIFY ACCESS ERROR:", error);
        await req.logAction({
            accion: error.message,
            apartado: "VerifyAccess",
            type: 'error'
        });
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
  };
}

const ctrlVerify = new VerifyController();
export { ctrlVerify };

