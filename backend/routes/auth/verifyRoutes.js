import express from "express";

import { ctrlVerify } from "../../controllers/auth/verifyController.js";

const router = express.Router();

router.post("/verify-code", ctrlVerify.verifyAccess);

export default router;
