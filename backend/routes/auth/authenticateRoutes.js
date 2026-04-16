import express from "express";

import { ctrlAuthenticate } from "../../controllers/auth/authenticateController.js";

const router = express.Router();

router.post("/login", ctrlAuthenticate.authenticate);

export default router;
