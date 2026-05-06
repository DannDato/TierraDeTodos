import express from "express";

import { ctrlMenu } from "../../controllers/system/menuController.js";
import { verifyToken } from "../../middlewares/verifyToken.js";

const router = express.Router();

router.get("/menu", verifyToken, ctrlMenu.getUserMenu);

export default router;

