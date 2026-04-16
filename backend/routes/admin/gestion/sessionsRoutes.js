import express from "express";

import { ctrlSessions } from "../../../controllers/admin/gestion/sessionsController.js";
import { verifyToken } from "../../../middlewares/verifyToken.js";
import { checkPermissions } from "../../../middlewares/checkPermissions.js";

const router = express.Router();

router.get("/sessions", verifyToken, checkPermissions(["menu.userscontrol", "menu.users"]), ctrlSessions.getGlobalSessions);
router.patch("/sessions/:id/revoke", verifyToken, checkPermissions(["menu.userscontrol", "menu.users"]), ctrlSessions.revokeSession);

export default router;
