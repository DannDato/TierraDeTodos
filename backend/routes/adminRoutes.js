import express from "express";

import {
	getUsersAdminList,
	getAdminUserById,
	updateAdminUserDetails,
	updateAdminUserPermissions,
	updateAdminUserRole
} from "../controllers/admin/usersAdminController.js";
import {verifyToken} from "../middlewares/verifyToken.js";
import {checkPermissions} from "../middlewares/checkPermissions.js";

const router = express.Router();

router.get('/users', verifyToken, checkPermissions(['menu.users']), getUsersAdminList);
router.get('/user/:id', verifyToken, checkPermissions(['user.view','user.edit' ]), getAdminUserById);
router.patch('/user/:id/details', verifyToken, checkPermissions(['menu.users', 'menu.userscontrol']), updateAdminUserDetails);
router.patch('/user/:id/role', verifyToken, checkPermissions(['menu.users', 'menu.userscontrol']), updateAdminUserRole);
router.patch('/user/:id/permissions', verifyToken, checkPermissions(['menu.users', 'menu.userscontrol']), updateAdminUserPermissions);

export default router;
