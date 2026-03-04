import express from "express";
import {verifyToken} from "../middlewares/authMiddleweare.js";
import {login} from "../controllers/authController.js";

const router = express.Router();

router.post('/login', login);

export default router