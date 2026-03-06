
import { models, db } from '../../models/index.js';
import { Op } from 'sequelize';
import generateDeviceHash from '../../utils/generateDeviceHash.js';
import { createAccessCode } from '../../helpers/createCodes.js';
import bcrypt from 'bcrypt';
import logger from '../../helpers/winston.js';

export const profile = async (req, res) => {
    const { email, password, username } = req.body;

    try {
        logger.debug("llega al profile controller")
        return res.status(200).json({
            message: 'llega al profile controller'
        });        

    } catch (error) {
        console.error("PROFILE ERROR:", error);
        await req.logAction({
            accion: error.message,
            apartado: "Perfil",
            type: 'error'
        });
        return res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
};