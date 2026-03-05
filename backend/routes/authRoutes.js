import express from "express";
import {authenticate, verifyAccess} from "../controllers/authController.js";
// import {verifyToken} from "../middlewares/authMiddleweare.js";

const router = express.Router();

router.post('/login', authenticate);
router.post('/verify-code', verifyAccess);

export default router