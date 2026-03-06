import bcrypt from "bcrypt";
import {models} from "../models/index.js";

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