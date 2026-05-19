import jwt from 'jsonwebtoken';
import { models, } from '../../models/index.js';
import { Op } from 'sequelize';
import { createAccessCode } from '../../helpers/createCodes.js';
import { CreateSession } from '../../helpers/CreateSession.js';
import { getActualEdition } from '../../utils/getEdition.js';
import bcrypt from 'bcrypt';
import { buildDeviceLookup, buildUserDevicePayload, getDeviceContext, isUsableIpAddress } from '../../utils/deviceIdentity.js';

class AuthenticateController {
    ensureUserInActiveEdition = async ({ userId }) => {
        const actualEdition = await getActualEdition();
        if (!actualEdition) return null;

        await models.UserEdition.findOrCreate({
            where: {
                editionId: actualEdition.id,
                userID: userId
            },
            defaults: {
                source: 'LOGIN'
            }
        });

        return actualEdition;
    };

  authenticate = async (req, res) => {
    const { usuario, password } = req.body;
    
    try {
        if (!usuario || !password) {
            await req.logAction({
                accion: "Login fallido - datos incompletos",
                apartado: "Login",
                query:"select",
                condicion:"username/email lookup",
                valor: `usuario: ${usuario ? 'provided' : 'missing'}, password: ${password ? 'provided' : 'missing'}`,
                type:"warn"
            });
            return res.status(400).json({ message: 'Datos incompletos' });
        }

        const deviceContext = getDeviceContext(req);

        const user = await models.Users.findOne({
            where: {
                [Op.or]: [
                    { username: usuario },
                    { email: usuario }
                ]
            }
        });

        
        if (!user) {
            // Hash válido (bcrypt cost 10) para mantener tiempo de respuesta constante y no revelar si el usuario existe
            await bcrypt.compare(password, '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36DRcra6');
            await models.Attempts.create({
                user: null,
                action_type: 'LOGIN',
                status: 'FAILED',
                reason: 'Usuario no encontrado',
                ip_address: deviceContext.ip,
                user_agent: deviceContext.userAgent
            });
            await req.logAction({
                accion: "Login fallido - usuario no encontrado",
                apartado: "Login",
                tabla: "Users",
                condicion: "username/email lookup",
                valor: usuario
            });
            return res.status(401).json({
                message: 'Usuario/correo o contraseña incorrecta'
            });
        }

        // validar contraseña
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            await models.Attempts.create({
                user: user.id,
                action_type: 'LOGIN',
                status: 'FAILED',
                reason: 'Contraseña incorrecta',
                ip_address: deviceContext.ip,
                user_agent: deviceContext.userAgent
            });
            await req.logAction({
                accion: "Login fallido - contraseña incorrecta",
                apartado: "Login",
                userId: user.id,
                username: user.username
            });         
            return res.status(401).json({
                message: 'Usuario/correo o contraseña incorrecta'
            });
        }

        // Login exitoso
        await req.logAction({
            accion: "Login exitoso",
            apartado: "Login",
            userId: user.id,
            username: user.username,
            valor: deviceContext.ip
        });
        //limpiar intentos fallidos 
        await models.Attempts.destroy({
            where: {
                user: user.id,
                action_type: 'LOGIN',
                status: 'FAILED'
            }
        });
        // Registrar intento exitoso
        await models.Attempts.create({
            user: user.id,
            action_type: 'LOGIN',
            status: 'SUCCESS',
            ip_address: deviceContext.ip,
            user_agent: deviceContext.userAgent
        });

        await this.ensureUserInActiveEdition({ userId: user.id });

        const deviceHash = deviceContext.deviceHash;
        const deniedLookup = buildDeviceLookup(deviceContext);

        if (deviceContext.deviceId) {
            deniedLookup.push({ device_id: deviceContext.deviceId });
        }

        const canUseDeniedFallbackSignature = Boolean(
            isUsableIpAddress(deviceContext.ip)
            && deviceContext.userAgent
            && deviceContext.browser
            && deviceContext.browser !== 'unknown'
            && deviceContext.os
            && deviceContext.os !== 'unknown'
        );

        if (canUseDeniedFallbackSignature) {
            deniedLookup.push({
                ip_address: deviceContext.ip,
                user_agent: deviceContext.userAgent,
                browser: deviceContext.browser || null,
                os: deviceContext.os || null,
                platform: deviceContext.platform || null,
                device_type: deviceContext.deviceType || null,
            });
        }

        const deniedDevice = await models.UserDevices.findOne({
            where: {
                user: user.id,
                [Op.or]: deniedLookup,
                authorized: "DENIED"
            }
        });

        if (deniedDevice) {
            await req.logAction({
                accion: "Intento de login bloqueado por dispositivo denegado",
                apartado: "Login",
                userId: user.id,
                username: user.username,
                valor: `deviceHash=${deviceHash}; ip=${deviceContext.ip}`,
                type: "warn"
            });

            return res.status(403).json({
                message: "Tu dispositivo ha sido bloqueado. Contacta a un administrador."
            });
        }

        const existingDevice = await models.UserDevices.findOne({
            where: {
                user: user.id,
                [Op.or]: buildDeviceLookup(deviceContext),
                authorized: "AUTHORIZED"
            }
        });

        const fingerprintChanged = Boolean(
            existingDevice
            && existingDevice.fingerprint_hash
            && deviceContext.fingerprintHash
            && existingDevice.fingerprint_hash !== deviceContext.fingerprintHash
        );

        if (!existingDevice || fingerprintChanged) {
            await models.UserDevices.destroy({
                where: {
                    user: user.id,
                    [Op.or]: buildDeviceLookup(deviceContext),
                    authorized: "PENDING"
                }
            })

            await models.UserDevices.create(
                buildUserDevicePayload({
                    userId: user.id,
                    context: deviceContext,
                    authorized: "PENDING"
                })
            );

            var enviado = await createAccessCode(user, deviceHash, req, res);
            if(enviado){
                return res.status(200).json({
                    type:"new_device",
                    message: 'Nuevo dispositivo detectado. Se ha enviado un código de verificación a tu correo.'
                });
            } else {
                return res.status(500).json({
                    message: 'Error al generar el código de verificación'
                });
            }

        } else {
            const updatePayload = buildUserDevicePayload({
                userId: user.id,
                context: deviceContext,
                authorized: "AUTHORIZED"
            });

            delete updatePayload.user;
            delete updatePayload.authorized;

            Object.assign(existingDevice, updatePayload);
            existingDevice.last_login = new Date();
            await existingDevice.save();
        }

        
        // Generar token JWT
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
        console.error("AUTH ERROR:", error);
        await req.logAction({
            accion: "Error interno del servidor",
            apartado: "Login",
            valor: error.message,
            type:"error"
        });
        return res.status(500).json({
            message: "Error interno del servidor"
        });
    }
  };
}

const ctrlAuthenticate = new AuthenticateController();
export { ctrlAuthenticate };

