import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import {models} from "../models/index.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export const createAccessCode = async (user, deviceHash, req, res) => {
    try {
        const generateNumber = () => {
            var baseTime= new Date().getTime();
            var base=0
            const digitos = Math.floor(Math.log10(baseTime)) + 1;
            if (baseTime >= 6){
                base=Math.floor(baseTime / Math.pow(10, digitos - 6));
            }
            return Math.floor(base + Math.random() * 900000).toString();
        };

        const code = generateNumber();
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
            codigo: parseInt(code),
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
        if(process.env.SEND_MAIL === 'true'){
            const templatePath = path.join(__dirname, '../emails/nuevo-dispositivo.html');
            const htmlContent = fs.readFileSync(templatePath, 'utf-8').replace('{{CODE}}', code);
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
                text: `Tu código de verificación es: ${code}`,
                html: htmlContent

            };
            if(await transporter.sendMail(mailOptions)){
                req.logAction({
                    accion: "Código de verificación enviado por email",
                    apartado: "VerifyAccess",
                    userId: user.id,
                    username: user.username,
                    type:"info"
                });
            }
            else{
                req.logAction({
                    accion: "Error al enviar el email con el código de verificación",
                    apartado: "VerifyAccess",
                    userId: user.id,
                    username: user.username,
                    type:"error"
                });
                return false;
            }
        }

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