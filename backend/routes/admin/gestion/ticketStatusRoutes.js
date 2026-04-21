import express from 'express';

import { ctrlTicketStatus } from '../../../controllers/admin/gestion/ticketStatusController.js';
import { verifyToken } from '../../../middlewares/verifyToken.js';
import { checkPermissions } from '../../../middlewares/checkPermissions.js';

const router = express.Router();

router.get('/ticket-statuses',       verifyToken, checkPermissions(['gest.tickets']), ctrlTicketStatus.getAll);
router.post('/ticket-statuses',      verifyToken, checkPermissions(['gest.tickets']), ctrlTicketStatus.create);
router.put('/ticket-statuses/:id',   verifyToken, checkPermissions(['gest.tickets']), ctrlTicketStatus.update);
router.delete('/ticket-statuses/:id',verifyToken, checkPermissions(['gest.tickets']), ctrlTicketStatus.remove);

export default router;
