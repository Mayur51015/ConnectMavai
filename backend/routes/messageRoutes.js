const express = require('express');
const { getMessages, markAsSeen, editMessage, deleteMessage, deleteChat } = require('../controllers/messageController');
const auth = require('../middleware/auth');

const router = express.Router();

// DELETE /api/messages/chat/:userId - Delete entire chat with a user
router.delete('/chat/:userId', auth, deleteChat);

// PUT /api/messages/:messageId - Edit a message
router.put('/:messageId', auth, editMessage);

// DELETE /api/messages/:messageId - Delete a single message
router.delete('/:messageId', auth, deleteMessage);

// PUT /api/messages/seen - Mark messages from a sender as seen
router.put('/seen', auth, markAsSeen);

// GET /api/messages/:userId - Get messages between current user and userId (paginated)
router.get('/:userId', auth, getMessages);

module.exports = router;
