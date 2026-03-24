const mongoose = require('mongoose');

/**
 * ContactRequest Schema
 * Manages permission-based messaging between users
 */
const contactRequestSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
}, {
  timestamps: true,
});

// Prevent duplicate requests
contactRequestSchema.index({ from: 1, to: 1 }, { unique: true });

module.exports = mongoose.model('ContactRequest', contactRequestSchema);
