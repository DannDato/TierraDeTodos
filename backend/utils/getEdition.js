import { db } from '../models/index.js';
import { logAction } from '../helpers/logger.js';

const getActualEdition = async () => {
    try {
        const [result] = await db.query(`
            SELECT id, name, number, date_start, date_end, description, status
            FROM edition
            WHERE status = 'ACTIVE'
            ORDER BY date_start DESC
            LIMIT 1
        `);
        return result.length > 0 ? result[0] : null;
    } catch (error) {
        await logAction({
            accion: 'Error al obtener la edición actual',
            apartado: 'getActualEdition',
            type: 'error',
            valor: error.message
        });
        throw error;
    }
};

const getActualEditionByUser = async (userId) => {
    try {
        const [result] = await db.query(`
            SELECT e.id, e.name, e.number, e.date_start, e.date_end, e.description, e.status
            FROM edition e
            INNER JOIN user_editions ue ON ue.editionId = e.id
            WHERE ue.userID = ? AND e.status = 'ACTIVE'
            ORDER BY e.date_start DESC
            LIMIT 1
        `, [userId]);

        return result.length > 0 ? result[0] : null;

    } catch (error) {
        await logAction({
            accion: 'Error al obtener la edición actual del usuario',
            apartado: 'getActualEditionByUser',
            type: 'error',
            valor: error.message
        });
        throw error;
    }
}

export { getActualEdition, getActualEditionByUser };