const express = require('express');
const router = express.Router();
const diaryController = require('../controllers/diaryController');
const authMiddleware = require('../middleware/auth');


router.post('/entries',authMiddleware,  diaryController.createEntry);
router.post('/:entryId/comments', authMiddleware, diaryController.addComment);
router.put('/entries/:entryId/disable-comments', authMiddleware, diaryController.disableComments);
router.delete('/entries/:entryId', authMiddleware ,diaryController.deleteEntry);
router.put('/entries/:entryId/like', authMiddleware, diaryController.likeEntry);
router.get('/entries',  diaryController.getEntries);
router.get('/entries/:entryId', diaryController.getEntry);
router.get('/entries/user/:userId', diaryController.getEntriesFromUser);

module.exports = router;
