import express from 'express';

import { ctrlSystemAdmin } from '../../../controllers/admin/gestion/systemController.js';
import { verifyToken } from '../../../middlewares/verifyToken.js';
import { checkPermissions } from '../../../middlewares/checkPermissions.js';

const router = express.Router();

router.get('/system-information', verifyToken, checkPermissions(['system_information.view']), ctrlSystemAdmin.getSettings);
router.get('/system-information/links', verifyToken, checkPermissions(['system_information.view']), ctrlSystemAdmin.getLinks);
router.put('/system-information/links', verifyToken, checkPermissions(['system_information.gest']), ctrlSystemAdmin.updateLinks);
router.put('/system-information/:key', verifyToken, checkPermissions(['system_information.gest']), ctrlSystemAdmin.upsertSetting);

export default router;

