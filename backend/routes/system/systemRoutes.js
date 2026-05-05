import express from "express";

import { ctrlSystem } from "../../controllers/system/systemController.js";
import { verifyToken } from "../../middlewares/verifyToken.js";
import { checkPermissions } from "../../middlewares/checkPermissions.js";

const router = express.Router();

router.get('/public-settings', ctrlSystem.getPublicSettings);
router.get('/settings', verifyToken, checkPermissions(['system.view']), ctrlSystem.getSettings);
router.patch('/settings', verifyToken, checkPermissions(['system.edit']), ctrlSystem.updateSettings);
router.get('/health', verifyToken, checkPermissions(['system.view']), ctrlSystem.getHealth);

export default router;
