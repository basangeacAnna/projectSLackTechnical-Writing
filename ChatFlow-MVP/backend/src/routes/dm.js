const express = require('express');
const router = express.Router();
const dmController = require('../controllers/dmController');
const auth = require('../middleware/auth');

// All DM routes require authentication
router.use(auth);

// Start or get existing DM thread
router.post('/start', dmController.startDM);

// Get all DM threads for current user
router.get('/', dmController.getThreads);

// Get messages for a specific thread
router.get('/:threadId/messages', dmController.getMessages);

// Send a message in a thread
router.post('/:threadId/messages', dmController.sendMessage);

// Mark messages as read
router.put('/:threadId/read', dmController.markAsRead);

// Delete a message
router.delete('/:threadId/messages/:messageId', dmController.deleteMessage);

// Delete a thread
router.delete('/:threadId', dmController.deleteThread);

module.exports = router;
