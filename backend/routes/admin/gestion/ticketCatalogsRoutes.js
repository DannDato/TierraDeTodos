import express from 'express';

import { ctrlTicketCatalogs } from '../../../controllers/admin/gestion/ticketCatalogsController.js';
import { verifyToken } from '../../../middlewares/verifyToken.js';
import { checkPermissions } from '../../../middlewares/checkPermissions.js';

const router = express.Router();

router.get('/ticket-catalogs', verifyToken, checkPermissions(['gest.tickets']), ctrlTicketCatalogs.getCatalogs);

router.post('/ticket-catalogs/types', verifyToken, checkPermissions(['gest.tickets']), ctrlTicketCatalogs.createType);
router.put('/ticket-catalogs/types/:id', verifyToken, checkPermissions(['gest.tickets']), ctrlTicketCatalogs.updateType);
router.delete('/ticket-catalogs/types/:id', verifyToken, checkPermissions(['gest.tickets']), ctrlTicketCatalogs.deleteType);

router.post('/ticket-catalogs/priorities', verifyToken, checkPermissions(['gest.tickets']), ctrlTicketCatalogs.createPriority);
router.put('/ticket-catalogs/priorities/:id', verifyToken, checkPermissions(['gest.tickets']), ctrlTicketCatalogs.updatePriority);
router.delete('/ticket-catalogs/priorities/:id', verifyToken, checkPermissions(['gest.tickets']), ctrlTicketCatalogs.deletePriority);

export default router;
