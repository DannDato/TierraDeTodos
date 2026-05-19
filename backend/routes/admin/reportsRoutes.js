import express from 'express';

import { ctrlAdminReports } from '../../controllers/admin/reportsController.js';
import { verifyToken } from '../../middlewares/verifyToken.js';
import { checkPermissions } from '../../middlewares/checkPermissions.js';

const router = express.Router();

router.get('/reports/tickets', verifyToken, checkPermissions(['tickets.view', 'tickets.police']), ctrlAdminReports.getTickets);
router.get('/reports/tickets/:ticketCode/messages', verifyToken, checkPermissions(['tickets.view', 'tickets.manage', 'tickets.police']), ctrlAdminReports.getMessages);
router.post('/reports/tickets/:ticketCode/messages', verifyToken, checkPermissions(['tickets.manage', 'tickets.police']), ctrlAdminReports.addMessageAsSystem);
router.patch('/reports/tickets/:ticketCode/close', verifyToken, checkPermissions(['tickets.close']), ctrlAdminReports.closeTicket);
router.patch('/reports/tickets/:ticketCode/reject', verifyToken, checkPermissions(['tickets.close']), ctrlAdminReports.rejectTicket);

export default router;

