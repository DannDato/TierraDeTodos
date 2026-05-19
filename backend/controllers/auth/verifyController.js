import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { models } from '../../models/index.js';
import { Op } from 'sequelize';
import { verifyAccessCode } from '../../helpers/verifyCodes.js';
import { generateAccessCode, sendAccessCodeEmail } from '../../helpers/createCodes.js';
import { CreateSession } from '../../helpers/CreateSession.js';
import { buildDeviceLookup, getDeviceContext } from '../../utils/deviceIdentity.js';

class VerifyController {
  verifyAccess = async (req, res) => {
    const { codigo, usuario } = req.body;
    const genericVerifyMessage = 'Código o credenciales de verificación inválidas';
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
            return res.status(400).json({ message: genericVerifyMessage });
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
            return res.status(400).json({ message: genericVerifyMessage });
        }

        const deviceContext = getDeviceContext(req);
        const verificationResult = await verifyAccessCode(user, deviceContext, codigo, req, res);
        if(verificationResult.type === "error") {
            return res.status(400).json({ message: genericVerifyMessage });
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
    const genericResendMessage = 'Si la solicitud es válida, se enviará un código de verificación';

    try {
        if (!usuario) {
            return res.status(400).json({ message: 'Solicitud inválida' });
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
            return res.status(200).json({ message: genericResendMessage });
        }

        const deviceContext = getDeviceContext(req);
        const deviceLookup = buildDeviceLookup(deviceContext);

        const activeCode = await models.AccessCodes.findOne({
            where: {
                user: user.id,
                device_hash: deviceContext.deviceHash,
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
                valor: `deviceHash=${deviceContext.deviceHash}`,
                type: "warn"
            });
            return res.status(200).json({ message: genericResendMessage });
        }

        const newCode = generateAccessCode();
        const newCodeHash = await bcrypt.hash(newCode, 10);
        const newExpiration = new Date();
        newExpiration.setMinutes(newExpiration.getMinutes() + 10);

        activeCode.codigo = Number(newCode);
        activeCode.code = newCodeHash;
        activeCode.expires_at = newExpiration;
        activeCode.is_used = 'UNUSED';
        activeCode.verified_at = null;
        activeCode.ip_address = deviceContext.ip;
        await activeCode.save();

        const pendingDevice = await models.UserDevices.findOne({
            where: {
                user: user.id,
                authorized: 'PENDING',
                [Op.or]: deviceLookup
            },
            order: [['id', 'DESC']]
        });

        if (pendingDevice) {
            pendingDevice.device_hash = deviceContext.deviceHash;
            if (deviceContext.deviceId) {
                pendingDevice.device_id = deviceContext.deviceId;
            }
            pendingDevice.user_agent = deviceContext.userAgent;
            pendingDevice.ip_address = deviceContext.ip;
            pendingDevice.fingerprint_hash = deviceContext.fingerprintHash;
            pendingDevice.fingerprint_version = deviceContext.fingerprintVersion;
            pendingDevice.accept_language = deviceContext.acceptLanguage || null;
            pendingDevice.language = deviceContext.language || null;
            pendingDevice.timezone = deviceContext.timezone || null;
            pendingDevice.platform = deviceContext.platform || null;
            pendingDevice.browser = deviceContext.browser || null;
            pendingDevice.os = deviceContext.os || null;
            pendingDevice.device_type = deviceContext.deviceType || null;
            pendingDevice.screen_resolution = deviceContext.screenResolution || null;
            pendingDevice.color_depth = deviceContext.colorDepth;
            pendingDevice.pixel_ratio = deviceContext.pixelRatio || null;
            pendingDevice.hardware_concurrency = deviceContext.hardwareConcurrency;
            pendingDevice.device_memory = deviceContext.deviceMemory || null;
            pendingDevice.max_touch_points = deviceContext.maxTouchPoints;
            pendingDevice.fingerprint_metadata = JSON.stringify({
                sec_ch_ua: deviceContext.secChUa || null,
                sec_ch_ua_mobile: deviceContext.secChUaMobile || null,
                sec_ch_ua_platform: deviceContext.secChUaPlatform || null,
                hint: deviceContext.fingerprintHint || null,
            });
            pendingDevice.last_login = new Date();
            await pendingDevice.save();
        }

        const emailSent = await sendAccessCodeEmail({
            user,
            code: newCode,
            req,
            apartado: 'VerifyAccess'
        });

        if (!emailSent) {
            return res.status(500).json({ message: 'No se pudo reenviar el código' });
        }

        return res.status(200).json({ message: genericResendMessage });
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

