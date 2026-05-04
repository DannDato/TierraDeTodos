import express from 'express';
import { communityController } from '../../controllers/user/communityController.js';
import { verifyToken } from '../../middlewares/verifyToken.js';
import { uploadsCheck } from '../../utils/uploadsCheck.js';

const router = express.Router();


// Obtener comunidades
router.get('/communities', verifyToken, communityController.getAll);
router.get('/community', verifyToken, communityController.getMyCommunity);
router.get('/communities/can-manage', verifyToken, communityController.canManage);
router.post('/communities', verifyToken, /* checkPermissions(['community.manage']), */ communityController.create);
router.post('/communities/logo',verifyToken,uploadsCheck({ type: 'image', field: 'logo', maxSizeMb: 5 }),communityController.uploadCommunityLogo);

router.post('/community/:id/join', verifyToken, communityController.join);
router.post('/community/:id/leave', verifyToken, communityController.leave);
router.get('/community/requests', verifyToken, communityController.getRequests);
router.delete('/community/requests/:requestId', verifyToken, communityController.cancelRequest);
router.get('/community/manage/requests', verifyToken, communityController.getManageRequests);
router.patch('/community/requests/:requestId/approve', verifyToken, communityController.approveRequest);
router.patch('/community/requests/:requestId/reject', verifyToken, communityController.rejectRequest);
router.delete('/community/members/:memberId', verifyToken, communityController.removeMember);
router.get('/community/members', verifyToken, communityController.getMembers);

export default router;
