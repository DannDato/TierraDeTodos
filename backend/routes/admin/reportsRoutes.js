import express from 'express';

import { ctrlAdminReports } from '../../controllers/admin/reportsController.js';
import { verifyToken } from '../../middlewares/verifyToken.js';
import { checkPermissions } from '../../middlewares/checkPermissions.js';

const router = express.Router();

router.get('/reports/tickets',verifyToken, checkPermissions(['tickets.view', 'tickets.manage', 'tickets.police']), ctrlAdminReports.getTickets);
router.get('/reports/tickets/:id/messages',verifyToken, checkPermissions(['tickets.manage', 'tickets.police']), ctrlAdminReports.getMessages);
router.post('/reports/tickets/:id/messages', verifyToken, checkPermissions(['tickets.manage', 'tickets.police']), ctrlAdminReports.addMessageAsSystem);
router.patch('/reports/tickets/:id/close', verifyToken, checkPermissions(['tickets.close']), ctrlAdminReports.closeTicket);

export default router;
