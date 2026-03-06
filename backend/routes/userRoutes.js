import express from "express";

import {profile} from "../controllers/profile/profileController.js";
import {getUserMenu} from "../controllers/profile/menuController.js";
import {
	getUsersAdminList,
	getAdminUserById,
	updateAdminUserPermissions,
	updateAdminUserRole
} from "../controllers/profile/usersAdminController.js";
import {verifyToken} from "../middlewares/verifyToken.js";

const router = express.Router();

router.get('/profile', verifyToken, profile);
router.get('/menu', verifyToken, getUserMenu);
router.get('/admin/users', verifyToken, getUsersAdminList);
router.get('/admin/users/:id', verifyToken, getAdminUserById);
router.patch('/admin/users/:id/role', verifyToken, updateAdminUserRole);
router.patch('/admin/users/:id/permissions', verifyToken, updateAdminUserPermissions);

export default router