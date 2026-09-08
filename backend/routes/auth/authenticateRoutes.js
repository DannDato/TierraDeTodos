import express from "express";

import { ctrlAuthenticate } from "../../controllers/auth/authenticateController.js";
import { ctrlLogout } from "../../controllers/auth/logoutController.js";
import { ctrlRegister } from "../../controllers/auth/registerController.js";
import { ctrlVerify } from "../../controllers/auth/verifyController.js";
import { verifyToken } from "../../middlewares/verifyToken.js";
import { ctrlGoogleAuth } from "../../controllers/auth/googleAuthController.js";
import { ctrlTwitchAuth } from "../../controllers/auth/twitchAuthController.js";

const router = express.Router();

router.post("/login", ctrlAuthenticate.authenticate);
router.post("/register", ctrlRegister.register);
router.post("/verify-code", ctrlVerify.verifyAccess);
router.post("/resend-verify-code", ctrlVerify.resendAccessCode);
router.post("/logout", verifyToken, ctrlLogout.logout);

// Rutas para loggeo con google
router.get("/google/config",ctrlGoogleAuth.getGoogleConfig);
router.post("/google/complete-registration", ctrlGoogleAuth.completeRegistration);
router.get("/google/accounts", verifyToken, ctrlGoogleAuth.listConnectedAccounts);
router.post("/google/accounts", verifyToken, ctrlGoogleAuth.connectGoogleAccount);
router.delete("/google/accounts/:id", verifyToken, ctrlGoogleAuth.removeConnectedAccount);
router.get("/twitch/config", ctrlTwitchAuth.getConfig);
router.get("/twitch/start", ctrlTwitchAuth.start);
router.get("/twitch/connect", verifyToken, ctrlTwitchAuth.start);
router.get("/twitch/callback", ctrlTwitchAuth.callback);
router.post("/twitch/exchange", ctrlTwitchAuth.exchangeResult);
router.post("/external/complete-registration", ctrlGoogleAuth.completeRegistration);


/*
|--------------------------------------------------------------------------
| POST /auth/google
|--------------------------------------------------------------------------
|
| Body:
|
| {
|     "credential": "<GOOGLE_ID_TOKEN>"
| }
|
| Flujo:
|
| Google
|   ↓
| frontend recibe credential
|   ↓
| POST /auth/google
|   ↓
| GoogleAuthController
|   ↓
| verifyIdToken()
|   ↓
| buscar/crear Users
|   ↓
| comprobar UserDevices
|   ↓
| ┌───────────────┬─────────────────────┐
| │ AUTHORIZED    │ dispositivo nuevo   │
| │               │                     │
| │ JWT TDT       │ código por correo   │
| │ Session       │ verify-code         │
| └───────────────┴─────────────────────┘
|
*/

router.post("/google",ctrlGoogleAuth.authenticate);


export default router;

