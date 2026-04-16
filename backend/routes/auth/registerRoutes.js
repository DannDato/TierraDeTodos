import express from "express";

import { ctrlRegister } from "../../controllers/auth/registerController.js";

const router = express.Router();

router.post("/register", ctrlRegister.register);

export default router;
