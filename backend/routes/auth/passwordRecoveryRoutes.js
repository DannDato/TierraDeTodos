import express from "express";
import PasswordRecoveryController from "../../controllers/auth/passwordRecoveryController.js";

const router = express.Router();

router.post("/request-password-recovery", PasswordRecoveryController.requestPasswordRecovery);
router.post("/reset-password", PasswordRecoveryController.resetPassword);

export default router;
