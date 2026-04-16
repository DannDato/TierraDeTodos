import express from "express";

import { ctrlLogout } from "../../controllers/auth/logoutController.js";
import { verifyToken } from "../../middlewares/verifyToken.js";

const router = express.Router();

router.post("/logout", verifyToken, ctrlLogout.logout);

export default router;
