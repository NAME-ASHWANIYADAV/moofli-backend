const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/auth');

router.get('/notifications', authMiddleware, notificationController.getNotifications);
router.patch('/:notificationId/read', authMiddleware, notificationController.markAsRead);

module.exports = router;
