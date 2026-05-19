import express from 'express';

import { ctrlTickets } from '../../controllers/user/ticketsController.js';
import { verifyToken } from '../../middlewares/verifyToken.js';

const router = express.Router();

router.get('/tickets', verifyToken, ctrlTickets.getMyTickets);
router.post('/tickets', verifyToken, ctrlTickets.createTicket);
router.get('/tickets/:ticketCode/messages', verifyToken, ctrlTickets.getMessages);
router.post('/tickets/:ticketCode/messages', verifyToken, ctrlTickets.addMessage);

export default router;

