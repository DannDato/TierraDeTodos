import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { models } from '../models/index.js';
import { Op } from 'sequelize';
import e from 'express';
import generateDeviceHash from '../utils/generateDeviceHash.js';
import logger from '../helpers/winston.js';

export const authenticate = async (req, res) => {
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

        const now = Date.now();
        const windowTime = new Date(now - 5 * 60 * 1000);

        const user = await models.Users.findOne({
            where: {
                [Op.or]: [
                    { username: usuario },
                    { email: usuario }
                ]
            }
        });

        // Verificacion por ip
        const ipAttempts = await models.Attempts.count({
            where: {
                ip_address: req.ip,
                action_type: 'LOGIN',
                status: 'FAILED',
                createdAt: { [Op.gte]: windowTime }
            }
        });
        if (ipAttempts >= 20) {
            await req.logAction({
                accion: "Bloqueo temporal por IP - demasiados intentos fallidos",
                apartado: "Login",
                ip: req.ip,
                type:"warn"
            });
            return res.status(429).json({
                message: 'Demasiados intentos. Intenta nuevamente más tarde.'
            });
        }

        // verificacion por usuario (si existe)
        if (user) {
            const userAttempts = await models.Attempts.count({
                where: {
                    user: user.id,
                    action_type: 'LOGIN',
                    status: 'FAILED',
                    createdAt: { [Op.gte]: windowTime }
                }
            });

            if (userAttempts >= 5) {
                await req.logAction({
                    accion: "Cuenta bloqueada - múltiples intentos de login fallidos",
                    apartado: "Login",
                    userId: user.id,
                    username: user.username,
                    type:"warn"
                });
                return res.status(429).json({
                    message: 'Cuenta temporalmente bloqueada. Intenta más tarde.'
                });
            }
        }

        
        if (!user) {
            // evitar timing attack
            await bcrypt.compare(password, '$2b$10$invalidinvalidinvalidinvalidinv');
            await models.Attempts.create({
                user: null,
                action_type: 'LOGIN',
                status: 'FAILED',
                reason: 'Usuario no encontrado',
                ip_address: req.ip,
                user_agent: req.headers['user-agent']
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
                ip_address: req.ip,
                user_agent: req.headers['user-agent']
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
            username: user.username
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
            ip_address: req.ip,
            user_agent: req.headers['user-agent']
        });

        // Registrar dispositivo
        const deviceHash = generateDeviceHash(req);
        const existingDevice = await models.UserDevices.findOne({
            where: {
                user: user.id,
                device_hash: deviceHash,
                authorized: "AUTHORIZED"
            }
        });
        if (!existingDevice) {
            await models.UserDevices.create({
                user: user.id,
                device_hash: deviceHash,
                user_agent: req.headers['user-agent'],
                ip_address: req.ip,
                authorized: "AUTHORIZED"
            });
            const generateAccessCode = () => {
                return Math.floor(100000 + Math.random() * 900000).toString();
            };
            
            const code = generateAccessCode();
            const codeCrypted = await bcrypt.hash(code, 10);

            const expiration = new Date();
            expiration.setMinutes(expiration.getMinutes() + 10); // expira en 10 minutos

            const checkExistingCodes = await models.AccessCodes.findOne({
                where: {
                    user: user.id,
                    device_hash: deviceHash,
                    expires_at: { [Op.gt]: new Date() }
                }
            });
            if (checkExistingCodes) {await checkExistingCodes.destroy();}

            await models.AccessCodes.create({
                user: user.id,
                device_hash: deviceHash,
                code: codeCrypted,
                ip_address: req.ip,
                expires_at: expiration
            });
            // -------- SIMULACION ENVIO EMAIL --------
            if (process.env.NODE_ENV === 'development') {
                console.log("======================================");
                console.log(`Usuario: ${user.email}`);
                console.log(`Nuevo dispositivo detectado`);
                console.log(`Codigo de verificacion: ${code}`);
                console.log("Este codigo expira en 10 minutos");
                console.log("======================================");
            }
            
            await req.logAction({
                accion: "Login desde dispositivo nuevo",
                apartado: "Login",
                userId: user.id,
                username: user.username                
            });
            return res.status(200).json({
                type:"new_device",
                message: 'Nuevo dispositivo detectado. Se ha enviado un código de verificación a tu correo.'
            });

        } else {
            existingDevice.last_login = new Date();
            await existingDevice.save();
        }

        // Generar token JWT
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
            return res.status(400).json({ message: 'Código de verificación incorrecto o expirado' });
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