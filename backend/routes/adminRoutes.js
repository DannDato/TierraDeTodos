import express from "express";

import ctrlUsers from "../controllers/admin/usersAdminController.js";
import ctrlGestion from "../controllers/admin/gestionController.js";
import {verifyToken} from "../middlewares/verifyToken.js";
import {checkPermissions} from "../middlewares/checkPermissions.js";

const router = express.Router();

//rutas para gestion de sistema
router.get('/roles', verifyToken, checkPermissions(['gest.roles']), ctrlGestion.getRoles);

// Rutas para administración de usuarios
router.get('/users', verifyToken, checkPermissions(['menu.users']), ctrlUsers.getUsersAdminList);
router.get('/user/:id', verifyToken, checkPermissions(['user.view','user.edit' ]), ctrlUsers.getAdminUserById);
router.patch('/user/:id/details', verifyToken, checkPermissions(['menu.users', 'menu.userscontrol']), ctrlUsers.updateAdminUserDetails);
router.patch('/user/:id/role', verifyToken, checkPermissions(['menu.users', 'menu.userscontrol']), ctrlUsers.updateAdminUserRole);
router.patch('/user/:id/permissions', verifyToken, checkPermissions(['menu.users', 'menu.userscontrol']), ctrlUsers.updateAdminUserPermissions);


export default router;
