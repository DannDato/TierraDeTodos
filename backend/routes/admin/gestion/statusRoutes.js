import express from "express";

import { ctrlStatus } from "../../../controllers/admin/gestion/statusController.js";
import { verifyToken } from "../../../middlewares/verifyToken.js";
import { checkPermissions } from "../../../middlewares/checkPermissions.js";

const router = express.Router();

router.get('/statuses', verifyToken, checkPermissions(['statuses.view']), ctrlStatus.getStatuses);
router.post('/statuses', verifyToken, checkPermissions(['statuses.gest']), ctrlStatus.createStatus);
router.put('/statuses/:id', verifyToken, checkPermissions(['statuses.edit']), ctrlStatus.updateStatus);
router.delete('/statuses/:id', verifyToken, checkPermissions(['statuses.remove']), ctrlStatus.deleteStatus);

export default router;

