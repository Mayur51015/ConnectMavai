const Message = require('../models/Message');
const { decrypt } = require('../utils/encryption');

/**
 * Get messages between current user and another user (with pagination)
 * GET /api/messages/:userId?page=1&limit=50
 */
const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Fetch messages between the two users, sorted by timestamp descending for pagination
    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: userId },
        { senderId: userId, receiverId: currentUserId },
      ],
    })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Decrypt messages and reverse to get chronological order
    const decryptedMessages = messages.reverse().map((msg) => {
      try {
        return {
          ...msg,
          message: msg.message ? decrypt(msg.message) : '',
        };
      } catch {
        return { ...msg, message: '[Unable to decrypt]' };
      }
    });

    // Get total count for pagination info
    const total = await Message.countDocuments({
      $or: [
        { senderId: currentUserId, receiverId: userId },
        { senderId: userId, receiverId: currentUserId },
      ],
    });

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
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error fetching messages.' });
  }
};

/**
 * Mark messages as seen
 * PUT /api/messages/seen
 * Body: { senderId } - marks all messages from this sender as seen
 */
const markAsSeen = async (req, res) => {
  try {
    const { senderId } = req.body;
    const currentUserId = req.user.id;

    await Message.updateMany(
      {
        senderId,
        receiverId: currentUserId,
        status: { $ne: 'seen' },
      },
      { $set: { status: 'seen' } }
    );

    res.json({ message: 'Messages marked as seen.' });
  } catch (error) {
    console.error('Mark as seen error:', error);
    res.status(500).json({ message: 'Server error updating message status.' });
  }
};

/**
 * Edit a message
 * PUT /api/messages/:messageId
 */
const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { message: newText } = req.body;
    const currentUserId = req.user.id;

    if (!newText || !newText.trim()) {
      return res.status(400).json({ message: 'Message text is required.' });
    }

    const msg = await Message.findById(messageId);
    if (!msg) return res.status(404).json({ message: 'Message not found.' });
    if (msg.senderId.toString() !== currentUserId) {
      return res.status(403).json({ message: 'You can only edit your own messages.' });
    }

    const { encrypt } = require('../utils/encryption');
    msg.message = encrypt(newText.trim());
    msg.edited = true;
    msg.editedAt = new Date();
    await msg.save();

    res.json({ _id: msg._id, message: newText.trim(), edited: true, editedAt: msg.editedAt });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ message: 'Server error editing message.' });
  }
};

/**
 * Delete a single message (sender only)
 * DELETE /api/messages/:messageId
 */
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user.id;

    const msg = await Message.findById(messageId);
    if (!msg) return res.status(404).json({ message: 'Message not found.' });
    if (msg.senderId.toString() !== currentUserId) {
      return res.status(403).json({ message: 'You can only delete your own messages.' });
    }

    await Message.findByIdAndDelete(messageId);
    res.json({ _id: messageId, deleted: true });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error deleting message.' });
  }
};

/**
 * Delete entire chat with a user (both sides' messages)
 * DELETE /api/messages/chat/:userId
 */
const deleteChat = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    await Message.deleteMany({
      $or: [
        { senderId: currentUserId, receiverId: userId },
        { senderId: userId, receiverId: currentUserId },
      ],
    });

    res.json({ message: 'Chat deleted successfully.' });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ message: 'Server error deleting chat.' });
  }
};

/**
 * Upload a file (image, PDF, or voice) for chat
 * POST /api/messages/upload
 */
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const ext = req.file.originalname.split('.').pop().toLowerCase();
    let fileType = null;
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) fileType = 'image';
    else if (ext === 'pdf') fileType = 'pdf';
    else if (['webm', 'ogg', 'mp3', 'wav', 'm4a'].includes(ext)) fileType = 'voice';

    const fileUrl = `/uploads/files/${req.file.filename}`;
    res.json({ fileUrl, fileType, fileName: req.file.originalname });
  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({ message: 'Server error uploading file.' });
  }
};

module.exports = { getMessages, markAsSeen, editMessage, deleteMessage, deleteChat, uploadFile };
