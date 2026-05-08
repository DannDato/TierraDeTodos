import express from 'express';

import { ctrlEditions } from '../../../controllers/admin/gestion/editionsController.js';
import { verifyToken } from '../../../middlewares/verifyToken.js';
import { checkPermissions } from '../../../middlewares/checkPermissions.js';

const router = express.Router();

router.get('/editions', verifyToken, checkPermissions(['editions.view']), ctrlEditions.getEditions);
router.post('/editions', verifyToken, checkPermissions(['editions.gest']), ctrlEditions.createEdition);
router.get('/editions/:id/resources', verifyToken, checkPermissions(['editions.view']), ctrlEditions.getEditionResources);
router.put('/editions/:id', verifyToken, checkPermissions(['editions.edit']), ctrlEditions.updateEdition);
router.patch('/editions/:id/open', verifyToken, checkPermissions(['editions.gest']), ctrlEditions.openEdition);
router.patch('/editions/:id/close', verifyToken, checkPermissions(['editions.gest']), ctrlEditions.closeEdition);
router.post('/editions/:id/dates', verifyToken, checkPermissions(['editions.gest']), ctrlEditions.createEditionDate);
router.put('/editions/:id/dates/:dateId', verifyToken, checkPermissions(['editions.edit']), ctrlEditions.updateEditionDate);
router.delete('/editions/:id/dates/:dateId', verifyToken, checkPermissions(['editions.edit']), ctrlEditions.deleteEditionDate);
router.post('/editions/:id/dates/import-previous', verifyToken, checkPermissions(['editions.gest']), ctrlEditions.importDatesFromPreviousEdition);
router.post('/editions/:id/rules', verifyToken, checkPermissions(['editions.gest']), ctrlEditions.createEditionRule);
router.put('/editions/:id/rules/:ruleId', verifyToken, checkPermissions(['editions.edit']), ctrlEditions.updateEditionRule);
router.delete('/editions/:id/rules/:ruleId', verifyToken, checkPermissions(['editions.edit']), ctrlEditions.deleteEditionRule);
router.post('/editions/:id/rules/import-previous', verifyToken, checkPermissions(['editions.gest']), ctrlEditions.importRulesFromPreviousEdition);
router.delete('/editions/:id', verifyToken, checkPermissions(['editions.remove']), ctrlEditions.deleteEdition);

export default router;

