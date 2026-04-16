import express from "express";

import { ctrlDevices } from "../../../controllers/admin/gestion/devicesController.js";
import { verifyToken } from "../../../middlewares/verifyToken.js";
import { checkPermissions } from "../../../middlewares/checkPermissions.js";

const router = express.Router();

router.get("/devices", verifyToken, checkPermissions(["menu.userscontrol", "menu.users"]), ctrlDevices.getAuthorizedDevices);
router.get("/devices/:deviceHash/history", verifyToken, checkPermissions(["menu.userscontrol", "menu.users"]), ctrlDevices.getDeviceUsageHistory);
router.patch("/devices/:deviceHash/users/:userId/authorization", verifyToken, checkPermissions(["menu.userscontrol", "menu.users"]), ctrlDevices.updateDeviceAuthorization);

export default router;
