import express from 'express';

import { ctrlTicketStatus } from '../../../controllers/admin/gestion/ticketStatusController.js';
import { verifyToken } from '../../../middlewares/verifyToken.js';
import { checkPermissions } from '../../../middlewares/checkPermissions.js';

const router = express.Router();

router.get('/ticket-statuses', verifyToken, checkPermissions(['ticket_statuses.view']), ctrlTicketStatus.getAll);
router.post('/ticket-statuses', verifyToken, checkPermissions(['ticket_statuses.gest']), ctrlTicketStatus.create);
router.put('/ticket-statuses/:id', verifyToken, checkPermissions(['ticket_statuses.edit']), ctrlTicketStatus.update);
router.delete('/ticket-statuses/:id', verifyToken, checkPermissions(['ticket_statuses.remove']), ctrlTicketStatus.remove);

export default router;
