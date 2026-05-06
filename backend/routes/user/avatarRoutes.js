import express from "express";

import { ctrlAvatar } from "../../controllers/user/avatarController.js";
import { verifyToken } from "../../middlewares/verifyToken.js";
import { uploadsCheck } from "../../utils/uploadsCheck.js";

const router = express.Router();


router.post("/avatar",verifyToken,uploadsCheck({type: "image",field: "avatar",maxSizeMb: 5,}),ctrlAvatar.uploadAvatar);
router.patch("/avatar/position", verifyToken, ctrlAvatar.updateAvatarPosition);
router.delete("/avatar", verifyToken, ctrlAvatar.deleteAvatar);

export default router;

