const mongoose = require('mongoose');

/**
 * CallLog Schema
 * Stores call history between users: caller, receiver, type, status, duration
 */
const callLogSchema = new mongoose.Schema({
  caller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  callType: {
    type: String,
    enum: ['video', 'voice'],
    default: 'video',
  },
  status: {
    type: String,
    enum: ['ringing', 'answered', 'missed', 'rejected'],
    default: 'ringing',
  },
  duration: {
    type: Number,
    default: 0, // seconds
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  endedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Index for efficient querying of a user's call history
callLogSchema.index({ caller: 1, createdAt: -1 });
callLogSchema.index({ receiver: 1, createdAt: -1 });

module.exports = mongoose.model('CallLog', callLogSchema);
