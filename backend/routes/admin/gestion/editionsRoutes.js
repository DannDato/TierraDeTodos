import express from 'express';

import { ctrlEditions } from '../../../controllers/admin/gestion/editionsController.js';
import { verifyToken } from '../../../middlewares/verifyToken.js';
import { checkPermissions } from '../../../middlewares/checkPermissions.js';

const router = express.Router();

router.get('/editions', verifyToken, checkPermissions(['gest.editions']), ctrlEditions.getEditions);
router.post('/editions', verifyToken, checkPermissions(['gest.editions']), ctrlEditions.createEdition);
router.get('/editions/:id/resources', verifyToken, checkPermissions(['gest.editions']), ctrlEditions.getEditionResources);
router.put('/editions/:id', verifyToken, checkPermissions(['gest.editions']), ctrlEditions.updateEdition);
router.patch('/editions/:id/open', verifyToken, checkPermissions(['gest.editions']), ctrlEditions.openEdition);
router.patch('/editions/:id/close', verifyToken, checkPermissions(['gest.editions']), ctrlEditions.closeEdition);
router.post('/editions/:id/dates', verifyToken, checkPermissions(['gest.editions']), ctrlEditions.createEditionDate);
router.put('/editions/:id/dates/:dateId', verifyToken, checkPermissions(['gest.editions']), ctrlEditions.updateEditionDate);
router.delete('/editions/:id/dates/:dateId', verifyToken, checkPermissions(['gest.editions']), ctrlEditions.deleteEditionDate);
router.post('/editions/:id/dates/import-previous', verifyToken, checkPermissions(['gest.editions']), ctrlEditions.importDatesFromPreviousEdition);
router.post('/editions/:id/rules', verifyToken, checkPermissions(['gest.editions']), ctrlEditions.createEditionRule);
router.put('/editions/:id/rules/:ruleId', verifyToken, checkPermissions(['gest.editions']), ctrlEditions.updateEditionRule);
router.delete('/editions/:id/rules/:ruleId', verifyToken, checkPermissions(['gest.editions']), ctrlEditions.deleteEditionRule);
router.post('/editions/:id/rules/import-previous', verifyToken, checkPermissions(['gest.editions']), ctrlEditions.importRulesFromPreviousEdition);
router.delete('/editions/:id', verifyToken, checkPermissions(['gest.editions']), ctrlEditions.deleteEdition);

export default router;
