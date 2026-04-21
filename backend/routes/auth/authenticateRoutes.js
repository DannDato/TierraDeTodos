import express from "express";

import { ctrlAuthenticate } from "../../controllers/auth/authenticateController.js";
import { ctrlLogout } from "../../controllers/auth/logoutController.js";
import { ctrlRegister } from "../../controllers/auth/registerController.js";
import { ctrlVerify } from "../../controllers/auth/verifyController.js";
import { verifyToken } from "../../middlewares/verifyToken.js";
import { ctrlGoogleAuth } from "../../controllers/auth/googleAuthController.js";

const router = express.Router();

router.post("/login", ctrlAuthenticate.authenticate);
router.post("/register", ctrlRegister.register);
router.post("/verify-code", ctrlVerify.verifyAccess);
router.post("/resend-verify-code", ctrlVerify.resendAccessCode);
router.post("/logout", verifyToken, ctrlLogout.logout);
router.get("/google/authorized", ctrlGoogleAuth.handleGoogleAuth);
router.get("/google/unauthorized", ctrlGoogleAuth.handleGoogleNoAuth);


export default router;
