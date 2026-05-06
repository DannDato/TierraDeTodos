import express from 'express';

import { ctrlTicketCatalogs } from '../../controllers/system/ticketCatalogsController.js';
import { verifyToken } from '../../middlewares/verifyToken.js';
import { checkPermissions } from '../../middlewares/checkPermissions.js';

const router = express.Router();

router.get('/tickets/catalogs', verifyToken, checkPermissions(['menu.tickets', 'ticket_catalogs.view']), ctrlTicketCatalogs.catalogs);

export default router;

