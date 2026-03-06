import express from "express";

import {authenticate} from "../controllers/auth/authenticateController.js";
import {register} from "../controllers/auth/registerController.js";
import {verifyAccess} from "../controllers/auth/verifyController.js";

// import {verifyToken} from "../middlewares/authMiddleweare.js";

const router = express.Router();

router.post('/login', authenticate);
router.post('/verify-code', verifyAccess);
router.post('/register', register);

export default router