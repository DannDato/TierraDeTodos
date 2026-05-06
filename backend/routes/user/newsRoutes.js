import express from 'express';

import { ctrlNews } from '../../controllers/user/newsController.js';
import { verifyToken } from '../../middlewares/verifyToken.js';
import { checkPermissions } from '../../middlewares/checkPermissions.js';
import { uploadsCheck } from '../../utils/uploadsCheck.js';

const router = express.Router();

router.get('/news', verifyToken, ctrlNews.getNews);
router.get('/news/types', verifyToken, ctrlNews.getNewsTypes);
router.get('/news/:id/comments', verifyToken, ctrlNews.getNewsComments);
router.post('/news/:id/likes', verifyToken, ctrlNews.toggleNewsLike);
router.post('/news', verifyToken, checkPermissions(['news.create']), ctrlNews.createNews);
router.put('/news/:id', verifyToken, checkPermissions(['news.edit']), ctrlNews.updateNews);
router.delete('/news/:id', verifyToken, checkPermissions(['news.delete']), ctrlNews.deleteNews);
router.post('/news/:id/image', verifyToken, checkPermissions(['news.create', 'news.edit']), uploadsCheck({ type: 'image', field: 'newsImage', maxSizeMb: 5 }), ctrlNews.uploadNewsImage);
router.post('/news/:id/comments', verifyToken, ctrlNews.createNewsComment);
router.post('/news/:id/comments/:commentId/likes', verifyToken, ctrlNews.toggleCommentLike);

export default router;

