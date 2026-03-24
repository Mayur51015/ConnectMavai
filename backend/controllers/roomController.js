const Room = require('../models/Room');
const Message = require('../models/Message');
const { decrypt } = require('../utils/encryption');

/**
 * Create a new room
 * POST /api/rooms
 */
const createRoom = async (req, res) => {
  try {
    const { name, description, members } = req.body;
    const currentUserId = req.user.id;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Room name is required.' });
    }

    // Ensure creator is included in members
    const memberIds = [...new Set([currentUserId, ...(members || [])])];

    const room = new Room({
      name: name.trim(),
      description: description?.trim() || '',
      admin: currentUserId,
      members: memberIds,
    });

    await room.save();
    await room.populate('members', '-password');
    await room.populate('admin', '-password');

    res.status(201).json(room);
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ message: 'Server error creating room.' });
  }
};

/**
 * Get all rooms the current user belongs to
 * GET /api/rooms
 */
const getRooms = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const rooms = await Room.find({ members: currentUserId })
      .populate('members', '-password')
      .populate('admin', '-password')
      .sort({ updatedAt: -1 })
      .lean();

    res.json(rooms);
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ message: 'Server error fetching rooms.' });
  }
};

/**
 * Add a member to a room (admin only)
 * POST /api/rooms/:roomId/members
 */
const addMember = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.body;
    const currentUserId = req.user.id;

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    if (room.admin.toString() !== currentUserId) {
      return res.status(403).json({ message: 'Only the admin can add members.' });
    }
    if (room.members.map(m => m.toString()).includes(userId)) {
      return res.status(400).json({ message: 'User is already a member.' });
    }

    room.members.push(userId);
    await room.save();
    await room.populate('members', '-password');
    await room.populate('admin', '-password');

    res.json(room);
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ message: 'Server error adding member.' });
  }
};

/**
 * Remove a member from a room (admin only)
 * DELETE /api/rooms/:roomId/members/:userId
 */
const removeMember = async (req, res) => {
  try {
    const { roomId, userId } = req.params;
    const currentUserId = req.user.id;

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    if (room.admin.toString() !== currentUserId) {
      return res.status(403).json({ message: 'Only the admin can remove members.' });
    }
    if (userId === currentUserId) {
      return res.status(400).json({ message: 'Admin cannot remove themselves.' });
    }

    room.members = room.members.filter(m => m.toString() !== userId);
    await room.save();
    await room.populate('members', '-password');
    await room.populate('admin', '-password');

    res.json(room);
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Server error removing member.' });
  }
};

/**
 * Get messages for a room (paginated)
 * GET /api/rooms/:roomId/messages
 */
const getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const currentUserId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Verify user is a member
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    if (!room.members.map(m => m.toString()).includes(currentUserId)) {
      return res.status(403).json({ message: 'You are not a member of this room.' });
    }

    const messages = await Message.find({ roomId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('senderId', 'username displayName')
      .lean();

    const decryptedMessages = messages.reverse().map((msg) => {
      try {
        return { ...msg, message: decrypt(msg.message) };
      } catch {
        return { ...msg, message: '[Unable to decrypt]' };
      }
    });

    const total = await Message.countDocuments({ roomId });

    res.json({
      messages: decryptedMessages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: skip + messages.length < total,
      },
    });
  } catch (error) {
    console.error('Get room messages error:', error);
    res.status(500).json({ message: 'Server error fetching room messages.' });
  }
};

/**
 * Delete a room (admin only)
 * DELETE /api/rooms/:roomId
 */
const deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const currentUserId = req.user.id;

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    if (room.admin.toString() !== currentUserId) {
      return res.status(403).json({ message: 'Only the admin can delete this room.' });
    }

    // Delete all messages in the room
    await Message.deleteMany({ roomId });
    // Delete the room
    await Room.findByIdAndDelete(roomId);

    res.json({ message: 'Room deleted successfully.' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ message: 'Server error deleting room.' });
  }
};

/**
 * Leave a room (any member)
 * POST /api/rooms/:roomId/leave
 */
const leaveRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const currentUserId = req.user.id;

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found.' });

    if (room.admin.toString() === currentUserId) {
      return res.status(400).json({ message: 'Admin cannot leave. Delete the room instead.' });
    }

    room.members = room.members.filter(m => m.toString() !== currentUserId);
    await room.save();

    res.json({ message: 'Left room successfully.' });
  } catch (error) {
    console.error('Leave room error:', error);
    res.status(500).json({ message: 'Server error leaving room.' });
  }
};

module.exports = { createRoom, getRooms, addMember, removeMember, getRoomMessages, deleteRoom, leaveRoom };
