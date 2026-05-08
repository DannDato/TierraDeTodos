import express from 'express';

import { ctrlCommandsAdmin } from '../../../controllers/admin/gestion/commandsController.js';
import { verifyToken } from '../../../middlewares/verifyToken.js';
import { checkPermissions } from '../../../middlewares/checkPermissions.js';

const router = express.Router();

router.get('/commands', verifyToken, checkPermissions(['commands.view']), ctrlCommandsAdmin.getAll);
router.get('/commands/permissions', verifyToken, checkPermissions(['commands.view']), ctrlCommandsAdmin.getPermissionOptions);
router.post('/commands', verifyToken, checkPermissions(['commands.gest']), ctrlCommandsAdmin.create);
router.put('/commands/:id', verifyToken, checkPermissions(['commands.edit']), ctrlCommandsAdmin.update);

export default router;

