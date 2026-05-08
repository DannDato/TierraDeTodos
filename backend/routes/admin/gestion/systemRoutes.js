import express from 'express';

import { ctrlSystemAdmin } from '../../../controllers/admin/gestion/systemController.js';
import { verifyToken } from '../../../middlewares/verifyToken.js';
import { checkPermissions } from '../../../middlewares/checkPermissions.js';

const router = express.Router();

router.get('/system-settings', verifyToken, checkPermissions(['system.view']), ctrlSystemAdmin.getSettings);
router.get('/system-settings/links', verifyToken, checkPermissions(['system.view']), ctrlSystemAdmin.getLinks);
router.put('/system-settings/links', verifyToken, checkPermissions(['system.gest']), ctrlSystemAdmin.updateLinks);
router.put('/system-settings/:key', verifyToken, checkPermissions(['system.gest']), ctrlSystemAdmin.upsertSetting);

export default router;

