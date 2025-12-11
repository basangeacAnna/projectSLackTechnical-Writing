const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Channels
router.get('/channels', chatController.getChannels);
router.post('/channels', chatController.createChannel);
router.delete('/channels/:channelId', chatController.deleteChannel);

// Messages
router.get('/messages/:channelId', chatController.getMessages);
router.post('/messages', chatController.sendMessage);

// Channel members (derived from messages in that channel)
router.get('/channels/:channelId/members', chatController.getChannelMembers);

module.exports = router;
