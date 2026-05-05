import express from "express";

import { ctrlUsers } from "../../../controllers/admin/users/usersController.js";
import { verifyToken } from "../../../middlewares/verifyToken.js";
import { checkPermissions } from "../../../middlewares/checkPermissions.js";

const router = express.Router();

router.get('/users', verifyToken, checkPermissions(['users.view']), ctrlUsers.getUsersAdminList);
router.get('/user/:id', verifyToken, checkPermissions(['users.view']), ctrlUsers.getAdminUserById);
router.patch('/user/:id/details', verifyToken, checkPermissions(['users.edit']), ctrlUsers.updateAdminUserDetails);
router.patch('/user/:id/role', verifyToken, checkPermissions(['users.edit']), ctrlUsers.updateAdminUserRole);
router.patch('/user/:id/permissions', verifyToken, checkPermissions(['users.edit']), ctrlUsers.updateAdminUserPermissions);

export default router;
