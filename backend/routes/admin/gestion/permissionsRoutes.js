import express from "express";

import { ctrlPermissions } from "../../../controllers/admin/gestion/permissionsController.js";
import { verifyToken } from "../../../middlewares/verifyToken.js";
import { checkPermissions } from "../../../middlewares/checkPermissions.js";

const router = express.Router();

router.get("/permissions", verifyToken, checkPermissions(["gest.permissions"]), ctrlPermissions.getPermissions);
router.post("/permissions", verifyToken, checkPermissions(["gest.permissions"]), ctrlPermissions.createPermission);
router.put("/permissions/:id", verifyToken, checkPermissions(["gest.permissions"]), ctrlPermissions.updatePermission);
router.delete("/permissions/:id", verifyToken, checkPermissions(["gest.permissions"]), ctrlPermissions.deletePermission);

export default router;
