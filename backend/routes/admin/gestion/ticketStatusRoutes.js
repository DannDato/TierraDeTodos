import express from 'express';

import { ctrlTicketStatus } from '../../../controllers/admin/gestion/ticketStatusController.js';
import { verifyToken } from '../../../middlewares/verifyToken.js';
import { checkPermissions } from '../../../middlewares/checkPermissions.js';

const router = express.Router();

router.get('/ticket-statuses', verifyToken, checkPermissions(['catalog.ticket_status.view']), ctrlTicketStatus.getAll);
router.post('/ticket-statuses', verifyToken, checkPermissions(['catalog.ticket_status.gest']), ctrlTicketStatus.create);
router.put('/ticket-statuses/:id', verifyToken, checkPermissions(['catalog.ticket_status.edit']), ctrlTicketStatus.update);
router.delete('/ticket-statuses/:id', verifyToken, checkPermissions(['catalog.ticket_status.remove']), ctrlTicketStatus.remove);

export default router;

