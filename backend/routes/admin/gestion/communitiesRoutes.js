import express from 'express';

import communitiesController from '../../../controllers/admin/gestion/communitiesController.js';
import { verifyToken } from '../../../middlewares/verifyToken.js';
import { checkPermissions } from '../../../middlewares/checkPermissions.js';

const router = express.Router();

const canView = checkPermissions(['communities.view']);
const canManage = checkPermissions(['communities.gest']);
const canRemove = checkPermissions(['communities.remove']);

router.get('/communities', verifyToken, canView, communitiesController.getAll);
router.put('/communities/:id', verifyToken, canManage, communitiesController.update);
router.delete('/communities/:id/logo', verifyToken, canManage, communitiesController.removeLogo);
router.delete('/communities/:id', verifyToken, canRemove, communitiesController.deleteCommunity);
router.get('/communities/:id/member-options', verifyToken, canView, communitiesController.getMemberOptions);
router.post('/communities/:id/bulk-action', verifyToken, canManage, communitiesController.bulkAction);

export default router;

