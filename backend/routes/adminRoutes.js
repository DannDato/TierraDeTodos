import express from "express";

import {
	getUsersAdminList,
	getAdminUserById,
	updateAdminUserDetails,
	updateAdminUserPermissions,
	updateAdminUserRole
} from "../controllers/admin/usersAdminController.js";
import {verifyToken} from "../middlewares/verifyToken.js";
// import {checkPermissions} from "../middlewares/checkPermissions.js";

const router = express.Router();

router.get('/users', verifyToken, getUsersAdminList);
router.get('/users/:id', verifyToken, getAdminUserById);
router.patch('/users/:id/details', verifyToken, updateAdminUserDetails);
router.patch('/users/:id/role', verifyToken, updateAdminUserRole);
router.patch('/users/:id/permissions', verifyToken, updateAdminUserPermissions);

export default router;
