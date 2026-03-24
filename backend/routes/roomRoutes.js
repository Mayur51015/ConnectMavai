const express = require('express');
const { createRoom, getRooms, addMember, removeMember, getRoomMessages, deleteRoom, leaveRoom } = require('../controllers/roomController');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/rooms - Create a new room
router.post('/', auth, createRoom);

// GET /api/rooms - Get user's rooms
router.get('/', auth, getRooms);

// DELETE /api/rooms/:roomId - Delete a room (admin only)
router.delete('/:roomId', auth, deleteRoom);

// POST /api/rooms/:roomId/leave - Leave a room
router.post('/:roomId/leave', auth, leaveRoom);

// POST /api/rooms/:roomId/members - Add member
router.post('/:roomId/members', auth, addMember);

// DELETE /api/rooms/:roomId/members/:userId - Remove member
router.delete('/:roomId/members/:userId', auth, removeMember);

// GET /api/rooms/:roomId/messages - Get room messages (paginated)
router.get('/:roomId/messages', auth, getRoomMessages);

module.exports = router;
