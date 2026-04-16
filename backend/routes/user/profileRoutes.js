import express from "express";

import { ctrlProfile } from "../../controllers/user/profileController.js";
import { verifyToken } from "../../middlewares/verifyToken.js";

const router = express.Router();

router.get("/profile", verifyToken, ctrlProfile.profile);

export default router;
