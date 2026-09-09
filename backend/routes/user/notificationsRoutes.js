import express from 'express';
import { verifyToken } from '../../middlewares/verifyToken.js';
import { ctrlNotifications } from '../../controllers/user/notificationsController.js';

const router = express.Router();
router.get('/notifications', verifyToken, ctrlNotifications.list);
router.get('/notifications/unread-count', verifyToken, ctrlNotifications.unreadCount);
router.patch('/notifications/:id/seen', verifyToken, ctrlNotifications.markSeen);
router.patch('/notifications/:id/read', verifyToken, ctrlNotifications.markRead);
router.patch('/notifications/:id/archive', verifyToken, ctrlNotifications.archive);
router.patch('/notifications/read-all', verifyToken, ctrlNotifications.markAllRead);

export default router;
