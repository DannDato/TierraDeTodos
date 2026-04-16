import express from "express";

import { ctrlStatus } from "../../../controllers/admin/gestion/statusController.js";
import { verifyToken } from "../../../middlewares/verifyToken.js";
import { checkPermissions } from "../../../middlewares/checkPermissions.js";

const router = express.Router();

router.get("/statuses", verifyToken, checkPermissions(["gest.statuses"]), ctrlStatus.getStatuses);
router.post("/statuses", verifyToken, checkPermissions(["gest.statuses"]), ctrlStatus.createStatus);
router.put("/statuses/:id", verifyToken, checkPermissions(["gest.statuses"]), ctrlStatus.updateStatus);
router.delete("/statuses/:id", verifyToken, checkPermissions(["gest.statuses"]), ctrlStatus.deleteStatus);

export default router;
