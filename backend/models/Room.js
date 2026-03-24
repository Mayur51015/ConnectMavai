const mongoose = require('mongoose');

/**
 * Room Schema
 * Stores group chat rooms with members and admin
 */
const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Room name is required'],
    trim: true,
    minlength: [2, 'Room name must be at least 2 characters'],
    maxlength: [50, 'Room name cannot exceed 50 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters'],
    default: '',
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
}, {
  timestamps: true,
});

roomSchema.index({ members: 1 });

module.exports = mongoose.model('Room', roomSchema);
