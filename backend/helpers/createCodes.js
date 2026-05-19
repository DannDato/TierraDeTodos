import bcrypt from "bcrypt";
import crypto from "crypto";
import nodemailer from "nodemailer";
import {models} from "../models/index.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ACCESS_CODE_LENGTH = 6;

export const generateAccessCode = () => {
    return crypto.randomInt(0, 10 ** ACCESS_CODE_LENGTH).toString().padStart(ACCESS_CODE_LENGTH, "0");
};

const normalizeCodeForSend = (value) => {
    const digits = String(value ?? "").replace(/\D/g, "");
    return digits.padStart(ACCESS_CODE_LENGTH, "0").slice(-ACCESS_CODE_LENGTH);
};

export const sendAccessCodeEmail = async ({ user, code, req, apartado = "VerifyAccess" }) => {
    try {
        const normalizedCode = normalizeCodeForSend(code);

        if (process.env.NODE_ENV === 'development') {
            console.log("======================================");
            console.log(`Usuario: ${user.email}`);
            console.log(`Nuevo dispositivo detectado`);
            console.log(`Codigo de verificacion: ${normalizedCode}`);
            console.log("Este codigo expira en 10 minutos");
            console.log("======================================");
        }

        if(process.env.SEND_MAIL === 'true'){
            const templatePath = path.join(__dirname, '../emails/nuevo-dispositivo.html');
            const htmlContent = fs.readFileSync(templatePath, 'utf-8').replace('{{CODE}}', normalizedCode);
            let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    type: 'login',
                    user: process.env.DANNBOT_MAIL_USER,
                    pass: process.env.DANNBOT_MAIL_PASS
                }
            });
            const mailOptions = {
                from: "Tierra de Todos <" + process.env.DANNBOT_MAIL_USER + ">",
                to: user.email,
                subject: 'Nuevo dispositivo detectado - Código de verificación',
                text: `Tu código de verificación es: ${normalizedCode}`,
                html: htmlContent

            };
            if(await transporter.sendMail(mailOptions)){
                await req.logAction({
                    accion: "Código de verificación enviado por email",
                    apartado,
                    userId: user.id,
                    username: user.username,
                    type:"info"
                });
                return true;
            }

            await req.logAction({
                accion: "Error al enviar el email con el código de verificación",
                apartado,
                userId: user.id,
                username: user.username,
                type:"error"
            });
            return false;
        }

        return true;
    } catch (error) {
        await req.logAction({
            accion: error.message,
            apartado,
            userId: user?.id,
            username: user?.username,
            type: 'error'
        });
        return false;
    }
};


export const createAccessCode = async (user, deviceHash, req, res) => {
    try {
        const code = generateAccessCode();
        const codeCrypted = await bcrypt.hash(code, 10);
        const expiration = new Date();
        expiration.setMinutes(expiration.getMinutes() + 10); // expira en 10 minutos

        const checkExistingCodes = await models.AccessCodes.findOne({
            where: {
                user: user.id,
                device_hash: deviceHash,
                // expires_at: { [Op.gt]: new Date() }
            }
        });
        if (checkExistingCodes) {await checkExistingCodes.destroy();}

        await models.AccessCodes.create({
            codigo: Number(code),
            user: user.id,
            device_hash: deviceHash,
            code: codeCrypted,
            ip_address: req.ip,
            expires_at: expiration
        });
        const emailSent = await sendAccessCodeEmail({ user, code, req, apartado: 'VerifyAccess' });
        if (!emailSent) {return false;}

        await req.logAction({
            accion: "Login desde dispositivo nuevo",
            apartado: "Login",
            userId: user.id,
            username: user.username
        });

        return true;
    } catch (error) {
        await req.logAction({
            accion: error.message,
            apartado: "Register",
            type: 'error'
        });
        return false;
    }

}
