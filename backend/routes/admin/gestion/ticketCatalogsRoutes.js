import express from 'express';

import { ctrlTicketCatalogs } from '../../../controllers/admin/gestion/ticketCatalogsController.js';
import { verifyToken } from '../../../middlewares/verifyToken.js';
import { checkPermissions } from '../../../middlewares/checkPermissions.js';

const router = express.Router();

router.get('/ticket-catalogs', verifyToken, checkPermissions(['ticket_catalogs.view']), ctrlTicketCatalogs.getCatalogs);

router.post('/ticket-catalogs/types', verifyToken, checkPermissions(['ticket_catalogs.gest']), ctrlTicketCatalogs.createType);
router.put('/ticket-catalogs/types/:id', verifyToken, checkPermissions(['ticket_catalogs.edit']), ctrlTicketCatalogs.updateType);
router.delete('/ticket-catalogs/types/:id', verifyToken, checkPermissions(['ticket_catalogs.remove']), ctrlTicketCatalogs.deleteType);

router.post('/ticket-catalogs/priorities', verifyToken, checkPermissions(['ticket_catalogs.gest']), ctrlTicketCatalogs.createPriority);
router.put('/ticket-catalogs/priorities/:id', verifyToken, checkPermissions(['ticket_catalogs.edit']), ctrlTicketCatalogs.updatePriority);
router.delete('/ticket-catalogs/priorities/:id', verifyToken, checkPermissions(['ticket_catalogs.remove']), ctrlTicketCatalogs.deletePriority);

export default router;

