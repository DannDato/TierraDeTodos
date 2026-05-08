import express from "express";

import { ctrlRoles } from "../../../controllers/admin/gestion/rolesController.js";
import { verifyToken } from "../../../middlewares/verifyToken.js";
import { checkPermissions } from "../../../middlewares/checkPermissions.js";

const router = express.Router();

router.get('/roles', verifyToken, checkPermissions(['roles.view']), ctrlRoles.getRoles);
router.post('/roles', verifyToken, checkPermissions(['roles.gest']), ctrlRoles.createRole);
router.put('/roles/:id', verifyToken, checkPermissions(['roles.edit']), ctrlRoles.updateRole);
router.delete('/roles/:id', verifyToken, checkPermissions(['roles.remove']), ctrlRoles.deleteRole);
router.get('/roles/:id/permissions', verifyToken, checkPermissions(['roles.view']), ctrlRoles.getRolePermissions);
router.patch('/roles/:id/permissions', verifyToken, checkPermissions(['roles.edit']), ctrlRoles.updateRolePermissions);

export default router;

