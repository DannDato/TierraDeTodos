import express from 'express';
import { communityController } from '../../controllers/user/communityController.js';
import { communityAdminController } from '../../controllers/user/communityAdminController.js';
import { verifyToken } from '../../middlewares/verifyToken.js';
import { checkPermissions } from '../../middlewares/checkPermissions.js';
import { uploadsCheck } from '../../utils/uploadsCheck.js';

const router = express.Router();

// Rutas para cualquier usuario autenticado
router.get('/communities', verifyToken, communityController.getAll);
router.get('/community', verifyToken, communityController.getMyCommunity);
router.get('/communities/can-manage', verifyToken, communityController.canManage);
router.post('/community/:id/join', verifyToken, communityController.join);
router.post('/community/:id/leave', verifyToken, communityController.leave);
router.get('/community/requests', verifyToken, communityController.getRequests);
router.delete('/community/requests/:requestId', verifyToken, communityController.cancelRequest);
router.get('/community/members', verifyToken, communityController.getMembers);

// Rutas exclusivas para usuarios con permiso community.manage
router.post('/communities', verifyToken, checkPermissions(['community.manage']), communityAdminController.create);
router.post('/communities/logo', verifyToken, uploadsCheck({ type: 'image', field: 'logo', maxSizeMb: 5 }), checkPermissions(['community.manage']), communityAdminController.uploadCommunityLogo);
router.get('/community/manage/requests', verifyToken, checkPermissions(['community.manage']), communityAdminController.getManageRequests);
router.patch('/community/requests/:requestId/approve', verifyToken, checkPermissions(['community.manage']), communityAdminController.approveRequest);
router.patch('/community/requests/:requestId/reject', verifyToken, checkPermissions(['community.manage']), communityAdminController.rejectRequest);
router.delete('/community/members/:memberId', verifyToken, checkPermissions(['community.manage']), communityAdminController.removeMember);

export default router;

