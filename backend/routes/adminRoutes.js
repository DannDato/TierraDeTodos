import express from "express";

import ctrlUsers from "../controllers/admin/usersAdminController.js";
import {ctrlRoles, ctrlPermissions, ctrlStatus} from "../controllers/admin/gestionController.js";
import {verifyToken} from "../middlewares/verifyToken.js";
import {checkPermissions} from "../middlewares/checkPermissions.js";

const router = express.Router();

//rutas para gestion de sistema
router.get('/roles', verifyToken, checkPermissions(['gest.roles']), ctrlRoles.getRoles);
router.post('/roles', verifyToken, checkPermissions(['gest.roles']), ctrlRoles.createRole);
router.put('/roles/:id', verifyToken, checkPermissions(['gest.roles']), ctrlRoles.updateRole);
router.delete('/roles/:id', verifyToken, checkPermissions(['gest.roles']), ctrlRoles.deleteRole);
router.get('/roles/:id/permissions', verifyToken, checkPermissions(['gest.roles']), ctrlRoles.getRolePermissions);
router.patch('/roles/:id/permissions', verifyToken, checkPermissions(['gest.roles']), ctrlRoles.updateRolePermissions);

router.get('/permissions', verifyToken, checkPermissions(['gest.permissions']), ctrlPermissions.getPermissions);
router.post('/permissions', verifyToken, checkPermissions(['gest.permissions']), ctrlPermissions.createPermission);
router.put('/permissions/:id', verifyToken, checkPermissions(['gest.permissions']), ctrlPermissions.updatePermission);
router.delete('/permissions/:id', verifyToken, checkPermissions(['gest.permissions']), ctrlPermissions.deletePermission);

router.get('/statuses', verifyToken, checkPermissions(['gest.statuses']), ctrlStatus.getStatuses);
router.post('/statuses', verifyToken, checkPermissions(['gest.statuses']), ctrlStatus.createStatus);
router.put('/statuses/:id', verifyToken, checkPermissions(['gest.statuses']), ctrlStatus.updateStatus);
router.delete('/statuses/:id', verifyToken, checkPermissions(['gest.statuses']), ctrlStatus.deleteStatus);

// Rutas para administración de usuarios
router.get('/users', verifyToken, checkPermissions(['menu.users']), ctrlUsers.getUsersAdminList);
router.get('/user/:id', verifyToken, checkPermissions(['user.view','user.edit' ]), ctrlUsers.getAdminUserById);
router.patch('/user/:id/details', verifyToken, checkPermissions(['menu.users', 'menu.userscontrol']), ctrlUsers.updateAdminUserDetails);
router.patch('/user/:id/role', verifyToken, checkPermissions(['menu.users', 'menu.userscontrol']), ctrlUsers.updateAdminUserRole);
router.patch('/user/:id/permissions', verifyToken, checkPermissions(['menu.users', 'menu.userscontrol']), ctrlUsers.updateAdminUserPermissions);


export default router;
