import bcrypt from "bcrypt";
import { Op } from 'sequelize';
import {models} from "../models/index.js";

export const verifyAccessCode = async (user, deviceHash, codigo, req, res) => {
    try {
        const accessCode = await models.AccessCodes.findOne({
            where: {
                user: user.id,
                device_hash: deviceHash,
                expires_at: { [Op.gt]: new Date() }
            }
        });

        const isCodeValid = accessCode ? await bcrypt.compare(codigo, accessCode.code) : false;

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
        accessCode.ip_address = req.ip;
        await accessCode.save();
        
        // Autorizar dispositivo
        const userDevice = await models.UserDevices.findOne({
            where: {
                user: user.id,
                device_hash: deviceHash
            }
        });
        userDevice.authorized = "AUTHORIZED";
        await userDevice.save();
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