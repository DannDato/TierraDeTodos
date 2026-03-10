import express from "express";

import {profile} from "../controllers/profile/profileController.js";
import {getUserMenu} from "../controllers/system/menuController.js";
import {verifyToken} from "../middlewares/verifyToken.js";

const router = express.Router();

router.get('/profile', verifyToken, profile);
router.get('/menu', verifyToken, getUserMenu);

export default router