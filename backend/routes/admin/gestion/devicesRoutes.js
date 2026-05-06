import express from "express";

import { ctrlDevices } from "../../../controllers/admin/gestion/devicesController.js";
import { verifyToken } from "../../../middlewares/verifyToken.js";
import { checkPermissions } from "../../../middlewares/checkPermissions.js";

const router = express.Router();

router.get('/devices', verifyToken, checkPermissions(['devices.view']), ctrlDevices.getAuthorizedDevices);
router.get('/devices/:deviceHash/history', verifyToken, checkPermissions(['devices.view']), ctrlDevices.getDeviceUsageHistory);
router.patch('/devices/:deviceHash/users/:userId/authorization', verifyToken, checkPermissions(['devices.edit']), ctrlDevices.updateDeviceAuthorization);

export default router;

