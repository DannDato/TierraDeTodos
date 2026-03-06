import express from "express";

import {profile} from "../controllers/profile/profileController.js";
import {verifyToken} from "../middlewares/verifyToken.js";

const router = express.Router();

router.get('/profile', verifyToken, profile);

export default router