import express from "express";

import { ctrlProfile } from "../../controllers/user/profileController.js";
import { verifyToken } from "../../middlewares/verifyToken.js";

const router = express.Router();


// Obtener perfil
router.get("/profile", verifyToken, ctrlProfile.profile);

// Iniciar cambio de correo
router.patch("/profile/email", verifyToken, ctrlProfile.requestEmailChange);

// Iniciar cambio de username
router.patch("/profile/username", verifyToken, ctrlProfile.requestUsernameChange);

// Verificar cambio (correo o username)
router.post("/profile/verify-change", verifyToken, ctrlProfile.verifyProfileChange);

// Revocar sesiones de un dispositivo específico
router.delete("/profile/devices/:id", verifyToken, ctrlProfile.revokeDevice);

export default router;

