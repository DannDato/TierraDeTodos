import bcrypt from "bcrypt";
import { Op } from 'sequelize';
import {models} from "../models/index.js";
import { buildDeviceLookup, buildUserDevicePayload } from "../utils/deviceIdentity.js";

const ACCESS_CODE_REGEX = /^\d{6}$/;

export const verifyAccessCode = async (user, deviceContext, codigo, req, res) => {
    try {
        const normalizedCode = String(codigo ?? "").replace(/\D/g, "");
        const deviceHash = deviceContext.deviceHash;

        if (!ACCESS_CODE_REGEX.test(normalizedCode)) {
            return {type: "error", message: "El código debe tener exactamente 6 dígitos"};
        }

        const accessCode = await models.AccessCodes.findOne({
            where: {
                user: user.id,
                device_hash: deviceHash,
                expires_at: { [Op.gt]: new Date() }
            }
        });

        const isCodeValid = accessCode ? await bcrypt.compare(normalizedCode, accessCode.code) : false;

        if (!isCodeValid) {
            await req.logAction({
                accion: "Verificación de dispositivo fallida - código incorrecto o expirado",
                apartado: "VerifyAccess",
                userId: user.id,
                username: user.username
            });         
            await models.Attempts.create({
                user: user.id,
                action_type: 'VERIFY-DEVICE',
                status: 'FAILED',
                reason: 'Código incorrecto o expirado',
                ip_address: req.ip,
                user_agent: req.headers['user-agent']
            });
            return {type: "error", message: "Código incorrecto o expirado"};
        }
        // Marcar código como usado
        accessCode.is_used = 'USED';
        accessCode.verified_at = new Date();
        accessCode.ip_address = deviceContext.ip;
        await accessCode.save();
        
        // Autorizar dispositivo (coincidencia por hash o device_id)
        const deviceLookup = buildDeviceLookup(deviceContext);
        const userDevice = await models.UserDevices.findOne({
            where: {
                user: user.id,
                [Op.or]: deviceLookup
            },
            order: [['id', 'DESC']]
        });

        if (userDevice) {
            const payload = buildUserDevicePayload({
                userId: user.id,
                context: deviceContext,
                authorized: "AUTHORIZED"
            });

            delete payload.user;
            Object.assign(userDevice, payload);
            userDevice.last_login = new Date();
            await userDevice.save();
        } else {
            await models.UserDevices.create(
                buildUserDevicePayload({
                    userId: user.id,
                    context: deviceContext,
                    authorized: "AUTHORIZED"
                })
            );
        }

        await req.logAction({
            accion: "Verificación de dispositivo exitosa",
            apartado: "VerifyAccess",
            userId: user.id,
            username: user.username
        });

        return {type: "success", message: "Dispositivo verificado correctamente"};
        
    } catch (error) {
        await req.logAction({
            accion: error.message,
            apartado: "VerifyAccess",
            type: 'error'
        });
        return {type: "error", message: "Error al verificar el código de acceso"};
    }

}
