import express from "express";

import { ctrlPermissions } from "../../../controllers/admin/gestion/permissionsController.js";
import { verifyToken } from "../../../middlewares/verifyToken.js";
import { checkPermissions } from "../../../middlewares/checkPermissions.js";

const router = express.Router();

router.get('/permissions', verifyToken, checkPermissions(['permissions.view']), ctrlPermissions.getPermissions);
router.post('/permissions', verifyToken, checkPermissions(['permissions.gest']), ctrlPermissions.createPermission);
router.put('/permissions/:id', verifyToken, checkPermissions(['permissions.edit']), ctrlPermissions.updatePermission);
router.delete('/permissions/:id', verifyToken, checkPermissions(['permissions.remove']), ctrlPermissions.deletePermission);

export default router;

