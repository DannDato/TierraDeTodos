import express from "express";

import { ctrlAuthenticate } from "../../controllers/auth/authenticateController.js";
import { ctrlLogout } from "../../controllers/auth/logoutController.js";
import { ctrlRegister } from "../../controllers/auth/registerController.js";
import { ctrlVerify } from "../../controllers/auth/verifyController.js";
import { verifyToken } from "../../middlewares/verifyToken.js";
import { ctrlGoogleAuth } from "../../controllers/auth/googleAuthController.js";
import {
	googleAuthRateLimit,
	loginRateLimit,
	registerRateLimit,
	resendVerifyCodeRateLimit,
	verifyCodeRateLimit,
} from "../../middlewares/publicAuthRateLimit.js";

const router = express.Router();

router.post("/login", loginRateLimit, ctrlAuthenticate.authenticate);
router.post("/register", registerRateLimit, ctrlRegister.register);
router.post("/verify-code", verifyCodeRateLimit, ctrlVerify.verifyAccess);
router.post("/resend-verify-code", resendVerifyCodeRateLimit, ctrlVerify.resendAccessCode);
router.post("/logout", verifyToken, ctrlLogout.logout);
router.post("/logout/all", verifyToken, ctrlLogout.logoutAll);
router.get("/google/authorized", googleAuthRateLimit, ctrlGoogleAuth.handleGoogleAuth);
router.get("/google/unauthorized", googleAuthRateLimit, ctrlGoogleAuth.handleGoogleNoAuth);


export default router;

