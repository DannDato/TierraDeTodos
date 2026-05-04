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


export default router;
// Obtener miembros de la comunidad del usuario logueado
router.get('/community/members', verifyToken, communityController.getMembers);
