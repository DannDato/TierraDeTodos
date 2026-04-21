import express from 'express';

import { ctrlTicketCatalogs } from '../../controllers/system/ticketCatalogsController.js';
import { verifyToken } from '../../middlewares/verifyToken.js';

const router = express.Router();

router.get('/tickets/catalogs', verifyToken, ctrlTicketCatalogs.catalogs);

export default router;
