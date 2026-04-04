const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Room = require('../models/Room');
const ContactRequest = require('../models/ContactRequest');
const CallLog = require('../models/CallLog');
const { encrypt, decrypt } = require('../utils/encryption');

/**
 * Map to track online users: userId -> Set of socketIds
 */
const onlineUsers = new Map();

/**
 * Check if two users are contacts (accepted request exists)
 */
const areContacts = async (userId1, userId2) => {
  const request = await ContactRequest.findOne({
    status: 'accepted',
    $or: [
      { from: userId1, to: userId2 },
      { from: userId2, to: userId1 },
    ],
  });
  return !!request;
};

/**
 * Initialize Socket.IO event handlers
 */
const initializeSocket = (io) => {
  // Middleware: authenticate socket connections using JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.username = decoded.username;
      next();
    } catch (error) {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    const username = socket.username;

    console.log(`✅ User connected: ${username} (${userId})`);

    // Track the user's socket connection
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Update user status to online
    await User.findByIdAndUpdate(userId, { status: 'online' });

    // Broadcast updated online users list
    const onlineUserIds = Array.from(onlineUsers.keys());
    io.emit('onlineUsers', onlineUserIds);

    // Deliver any pending messages (mark as delivered)
    await Message.updateMany(
      { receiverId: userId, status: 'sent' },
      { $set: { status: 'delivered' } }
    );

    // Notify senders about delivery
    const pendingMessages = await Message.find({
      receiverId: userId,
      status: 'delivered',
    }).distinct('senderId');

    pendingMessages.forEach((senderId) => {
      const senderSockets = onlineUsers.get(senderId.toString());
      if (senderSockets) {
        senderSockets.forEach((socketId) => {
          io.to(socketId).emit('messagesDelivered', { by: userId });
        });
      }
    });

    // Auto-join Socket.IO rooms for group chats
    try {
      const rooms = await Room.find({ members: userId });
      rooms.forEach((room) => {
        socket.join(`room:${room._id}`);
      });
    } catch (err) {
      console.error('Error joining rooms:', err);
    }

    /**
     * Handle sending a direct message (text and/or file)
     */
    socket.on('sendMessage', async (data, callback) => {
      try {
        const { receiverId, message, fileUrl, fileType, fileName } = data;

        // Check if users are contacts
        const contacts = await areContacts(userId, receiverId);
        if (!contacts) {
          if (callback) callback({ error: 'You must be contacts to send messages.' });
          return;
        }

        const encryptedMessage = message ? encrypt(message) : '';
        const isReceiverOnline = onlineUsers.has(receiverId);
        const initialStatus = isReceiverOnline ? 'delivered' : 'sent';

        const newMessage = new Message({
          senderId: userId,
          receiverId,
          message: encryptedMessage,
          fileUrl: fileUrl || null,
          fileType: fileType || null,
          fileName: fileName || null,
          status: initialStatus,
          timestamp: new Date(),
        });

        await newMessage.save();

        const messageData = {
          _id: newMessage._id,
          senderId: userId,
          receiverId,
          message: message || '',
          fileUrl: newMessage.fileUrl,
          fileType: newMessage.fileType,
          fileName: newMessage.fileName,
          timestamp: newMessage.timestamp,
          status: newMessage.status,
          edited: false,
        };

        // Send to receiver if online
        const receiverSockets = onlineUsers.get(receiverId);
        if (receiverSockets) {
          receiverSockets.forEach((socketId) => {
            io.to(socketId).emit('newMessage', messageData);
          });
        }

        if (callback) callback(messageData);

        // Send to sender's other tabs
        const senderSockets = onlineUsers.get(userId);
        if (senderSockets) {
          senderSockets.forEach((socketId) => {
            if (socketId !== socket.id) {
              io.to(socketId).emit('newMessage', messageData);
            }
          });
        }
      } catch (error) {
        console.error('Send message error:', error);
        if (callback) callback({ error: 'Failed to send message' });
      }
    });

    /**
     * Handle editing a message
     */
    socket.on('editMessage', async (data, callback) => {
      try {
        const { messageId, newText } = data;

        const msg = await Message.findById(messageId);
        if (!msg) {
          if (callback) callback({ error: 'Message not found' });
          return;
        }
        if (msg.senderId.toString() !== userId) {
          if (callback) callback({ error: 'You can only edit your own messages' });
          return;
        }

        msg.message = encrypt(newText.trim());
        msg.edited = true;
        msg.editedAt = new Date();
        await msg.save();

        const editData = {
          _id: msg._id,
          message: newText.trim(),
          edited: true,
          editedAt: msg.editedAt,
        };

        // Notify receiver
        if (msg.receiverId) {
          const receiverSockets = onlineUsers.get(msg.receiverId.toString());
          if (receiverSockets) {
            receiverSockets.forEach((socketId) => {
              io.to(socketId).emit('messageEdited', editData);
            });
          }
        }

        // Notify sender's other tabs
        const senderSockets = onlineUsers.get(userId);
        if (senderSockets) {
          senderSockets.forEach((socketId) => {
            if (socketId !== socket.id) {
              io.to(socketId).emit('messageEdited', editData);
            }
          });
        }

        if (callback) callback(editData);
      } catch (error) {
        console.error('Edit message error:', error);
        if (callback) callback({ error: 'Failed to edit message' });
      }
    });

    /**
     * Handle sending a room message (text and/or file)
     */
    socket.on('sendRoomMessage', async (data, callback) => {
      try {
        const { roomId, message, fileUrl, fileType, fileName } = data;

        // Verify membership
        const room = await Room.findById(roomId);
        if (!room || !room.members.map(m => m.toString()).includes(userId)) {
          if (callback) callback({ error: 'Not a member of this room' });
          return;
        }

        const encryptedMessage = message ? encrypt(message) : '';

        const newMessage = new Message({
          senderId: userId,
          roomId,
          message: encryptedMessage,
          fileUrl: fileUrl || null,
          fileType: fileType || null,
          fileName: fileName || null,
          status: 'sent',
          timestamp: new Date(),
        });

        await newMessage.save();

        const messageData = {
          _id: newMessage._id,
          senderId: userId,
          senderUsername: username,
          roomId,
          message: message || '',
          fileUrl: newMessage.fileUrl,
          fileType: newMessage.fileType,
          fileName: newMessage.fileName,
          timestamp: newMessage.timestamp,
          status: newMessage.status,
          edited: false,
        };

        // Emit to all room members
        io.to(`room:${roomId}`).emit('newRoomMessage', messageData);

        if (callback) callback(messageData);
      } catch (error) {
        console.error('Send room message error:', error);
        if (callback) callback({ error: 'Failed to send room message' });
      }
    });

    /**
     * Handle joining a room (after creation or invite)
     */
    socket.on('joinRoom', ({ roomId }) => {
      socket.join(`room:${roomId}`);
    });

    /**
     * Handle leaving a room
     */
    socket.on('leaveRoom', ({ roomId }) => {
      socket.leave(`room:${roomId}`);
    });

    /**
     * Handle contact request sent (real-time notification)
     */
    socket.on('contactRequestSent', ({ toUserId, request }) => {
      const receiverSockets = onlineUsers.get(toUserId);
      if (receiverSockets) {
        receiverSockets.forEach((socketId) => {
          io.to(socketId).emit('contactRequestReceived', request);
        });
      }
    });

    /**
     * Handle contact request accepted (notify both)
     */
    socket.on('contactAccepted', ({ toUserId }) => {
      const receiverSockets = onlineUsers.get(toUserId);
      if (receiverSockets) {
        receiverSockets.forEach((socketId) => {
          io.to(socketId).emit('contactAcceptedNotification', { by: userId, username });
        });
      }
    });

    /**
     * Handle typing indicator
     */
    socket.on('typing', ({ receiverId }) => {
      const receiverSockets = onlineUsers.get(receiverId);
      if (receiverSockets) {
        receiverSockets.forEach((socketId) => {
          io.to(socketId).emit('userTyping', { userId, username });
        });
      }
    });

    /**
     * Handle stop typing indicator
     */
    socket.on('stopTyping', ({ receiverId }) => {
      const receiverSockets = onlineUsers.get(receiverId);
      if (receiverSockets) {
        receiverSockets.forEach((socketId) => {
          io.to(socketId).emit('userStopTyping', { userId });
        });
      }
    });

    /**
     * Handle messages being seen
     */
    socket.on('messageSeen', async ({ senderId }) => {
      try {
        await Message.updateMany(
          {
            senderId,
            receiverId: userId,
            status: { $ne: 'seen' },
          },
          { $set: { status: 'seen' } }
        );

        const senderSockets = onlineUsers.get(senderId);
        if (senderSockets) {
          senderSockets.forEach((socketId) => {
            io.to(socketId).emit('messagesSeen', { by: userId });
          });
        }
      } catch (error) {
        console.error('Message seen error:', error);
      }
    });

    // ========================
    // WebRTC Video Call Signaling
    // ========================

    /**
     * Initiate a video/voice call
     * Creates a CallLog record with status 'ringing'
     */
    socket.on('callUser', async ({ to, offer, callerName, callType }) => {
      const type = callType || 'video';

      // Create a call log entry
      try {
        const callLog = new CallLog({
          caller: userId,
          receiver: to,
          callType: type,
          status: 'ringing',
          startedAt: new Date(),
        });
        await callLog.save();

        const receiverSockets = onlineUsers.get(to);
        if (receiverSockets) {
          receiverSockets.forEach((socketId) => {
            io.to(socketId).emit('incomingCall', {
              from: userId,
              callerName: callerName || username,
              offer,
              callType: type,
              callLogId: callLog._id.toString(),
            });
          });
        } else {
          // User offline — mark as missed
          callLog.status = 'missed';
          callLog.endedAt = new Date();
          await callLog.save();
          socket.emit('callRejected', { reason: 'User is offline' });

          // Emit updated call log to caller
          const populated = await CallLog.findById(callLog._id)
            .populate('caller', 'username displayName avatar')
            .populate('receiver', 'username displayName avatar')
            .lean();
          socket.emit('callLogUpdated', populated);
        }
      } catch (error) {
        console.error('Error creating call log:', error);
        // Still attempt the call even if logging fails
        const receiverSockets = onlineUsers.get(to);
        if (receiverSockets) {
          receiverSockets.forEach((socketId) => {
            io.to(socketId).emit('incomingCall', {
              from: userId,
              callerName: callerName || username,
              offer,
              callType: type || 'video',
            });
          });
        } else {
          socket.emit('callRejected', { reason: 'User is offline' });
        }
      }
    });

    /**
     * Accept a video/voice call
     */
    socket.on('callAccepted', async ({ to, answer, callLogId }) => {
      // Update call log to answered
      if (callLogId) {
        try {
          await CallLog.findByIdAndUpdate(callLogId, {
            status: 'answered',
            startedAt: new Date(),
          });
        } catch (err) {
          console.error('Error updating call log on accept:', err);
        }
      }

      const callerSockets = onlineUsers.get(to);
      if (callerSockets) {
        callerSockets.forEach((socketId) => {
          io.to(socketId).emit('callAccepted', { from: userId, answer, callLogId });
        });
      }
    });

    /**
     * Reject a video/voice call
     */
    socket.on('callRejected', async ({ to, reason, callLogId }) => {
      // Update call log to rejected
      if (callLogId) {
        try {
          const log = await CallLog.findByIdAndUpdate(callLogId, {
            status: 'rejected',
            endedAt: new Date(),
          }, { new: true })
            .populate('caller', 'username displayName avatar')
            .populate('receiver', 'username displayName avatar');

          // Notify both parties of call log update
          if (log) {
            const callerSockets = onlineUsers.get(log.caller._id.toString());
            const receiverSockets = onlineUsers.get(log.receiver._id.toString());
            const logData = log.toObject();
            if (callerSockets) callerSockets.forEach((sid) => io.to(sid).emit('callLogUpdated', logData));
            if (receiverSockets) receiverSockets.forEach((sid) => io.to(sid).emit('callLogUpdated', logData));
          }
        } catch (err) {
          console.error('Error updating call log on reject:', err);
        }
      }

      const callerSockets = onlineUsers.get(to);
      if (callerSockets) {
        callerSockets.forEach((socketId) => {
          io.to(socketId).emit('callRejected', { from: userId, reason: reason || 'Call rejected' });
        });
      }
    });

    /**
     * Exchange ICE candidates
     */
    socket.on('iceCandidate', ({ to, candidate }) => {
      const peerSockets = onlineUsers.get(to);
      if (peerSockets) {
        peerSockets.forEach((socketId) => {
          io.to(socketId).emit('iceCandidate', { from: userId, candidate });
        });
      }
    });

    /**
     * End a video/voice call
     */
    socket.on('endCall', async ({ to, callLogId, duration }) => {
      // Update call log with end time and duration
      if (callLogId) {
        try {
          const updateData = {
            endedAt: new Date(),
          };
          // If duration provided, use it; otherwise calculate from startedAt
          if (duration !== undefined) {
            updateData.duration = duration;
          }
          // Only mark as answered if it was previously ringing (might already be answered)
          const existing = await CallLog.findById(callLogId);
          if (existing && existing.status === 'ringing') {
            updateData.status = 'missed';
          }

          const log = await CallLog.findByIdAndUpdate(callLogId, updateData, { new: true })
            .populate('caller', 'username displayName avatar')
            .populate('receiver', 'username displayName avatar');

          // Notify both parties of final call log
          if (log) {
            const logData = log.toObject();
            const callerSockets = onlineUsers.get(log.caller._id.toString());
            const receiverSockets = onlineUsers.get(log.receiver._id.toString());
            if (callerSockets) callerSockets.forEach((sid) => io.to(sid).emit('callLogUpdated', logData));
            if (receiverSockets) receiverSockets.forEach((sid) => io.to(sid).emit('callLogUpdated', logData));
          }
        } catch (err) {
          console.error('Error updating call log on end:', err);
        }
      }

      const peerSockets = onlineUsers.get(to);
      if (peerSockets) {
        peerSockets.forEach((socketId) => {
          io.to(socketId).emit('callEnded', { from: userId });
        });
      }
    });

    /**
     * Handle disconnection
     */
    socket.on('disconnect', async () => {
      console.log(`❌ User disconnected: ${username} (${userId})`);

      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          await User.findByIdAndUpdate(userId, {
            status: 'offline',
            lastSeen: new Date(),
          });
        }
      }

      const onlineUserIds = Array.from(onlineUsers.keys());
      io.emit('onlineUsers', onlineUserIds);
    });
  });
};

module.exports = { initializeSocket };
