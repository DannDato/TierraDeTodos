import express from "express";

import { ctrlMenu } from "../../controllers/system/menuController.js";
import { verifyToken } from "../../middlewares/verifyToken.js";
import { checkPermissions } from "../../middlewares/checkPermissions.js";

const router = express.Router();

router.get("/menu", verifyToken, ctrlMenu.getUserMenu);
router.get("/menu/admin", verifyToken, checkPermissions(['menu.gestion']), ctrlMenu.getAdminMenu);
router.post("/menu/admin", verifyToken, checkPermissions(['menu.gestion']), ctrlMenu.createMenuItem);
router.put("/menu/admin/:id", verifyToken, checkPermissions(['menu.gestion']), ctrlMenu.updateMenuItem);
router.delete("/menu/admin/:id", verifyToken, checkPermissions(['menu.gestion']), ctrlMenu.deleteMenuItem);

export default router;

