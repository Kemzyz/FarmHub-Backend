const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const chatController = require('../controllers/chatController');

// Start or get conversation
router.post('/conversations/start', protect, chatController.startConversation);

// List conversations
router.get('/conversations', protect, chatController.listConversations);

// Conversation messages
router.get('/conversations/:id/messages', protect, chatController.getMessages);
router.post('/conversations/:id/messages', protect, chatController.sendMessage);

// Mark as read
router.post('/conversations/:id/mark-read', protect, chatController.markRead);

module.exports = router;