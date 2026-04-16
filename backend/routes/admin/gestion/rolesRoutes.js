import express from "express";

import { ctrlRoles } from "../../../controllers/admin/gestion/rolesController.js";
import { verifyToken } from "../../../middlewares/verifyToken.js";
import { checkPermissions } from "../../../middlewares/checkPermissions.js";

const router = express.Router();

router.get("/roles", verifyToken, checkPermissions(["gest.roles"]), ctrlRoles.getRoles);
router.post("/roles", verifyToken, checkPermissions(["gest.roles"]), ctrlRoles.createRole);
router.put("/roles/:id", verifyToken, checkPermissions(["gest.roles"]), ctrlRoles.updateRole);
router.delete("/roles/:id", verifyToken, checkPermissions(["gest.roles"]), ctrlRoles.deleteRole);
router.get("/roles/:id/permissions", verifyToken, checkPermissions(["gest.roles"]), ctrlRoles.getRolePermissions);
router.patch("/roles/:id/permissions", verifyToken, checkPermissions(["gest.roles"]), ctrlRoles.updateRolePermissions);

export default router;
