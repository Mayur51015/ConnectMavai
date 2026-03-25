const User = require('../models/User');
const bcrypt = require('bcryptjs');

/**
 * Get all users except the current user
 * GET /api/users
 */
const getUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const users = await User.find({ _id: { $ne: currentUserId } })
      .select('-password')
      .sort({ status: -1, username: 1 })
      .lean();

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error fetching users.' });
  }
};

/**
 * Update current user's profile (except username)
 * PUT /api/users/profile
 */
const updateProfile = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { displayName, bio, avatar, password } = req.body;

    const user = await User.findById(currentUserId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Update allowed fields
    if (displayName !== undefined) user.displayName = displayName.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (avatar !== undefined) user.avatar = avatar.trim();

    // Optionally update password
    if (password && password.length >= 6) {
      const salt = await bcrypt.genSalt(12);
      user.password = await bcrypt.hash(password, salt);
    } else if (password && password.length > 0 && password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    await user.save();

    res.json({
      id: user._id,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatar: user.avatar,
      status: user.status,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile.' });
  }
};

/**
 * Get current user's profile
 * GET /api/users/profile
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password').lean();
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error fetching profile.' });
  }
};

/**
 * Upload profile picture
 * POST /api/users/avatar
 */
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const currentUserId = req.user.id;
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    await User.findByIdAndUpdate(currentUserId, { avatar: avatarUrl });

    res.json({ avatar: avatarUrl });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ message: 'Server error uploading avatar.' });
  }
};

/**
 * Get a user's public profile by ID
 * GET /api/users/:userId
 */
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password')
      .lean();
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Server error fetching user profile.' });
  }
};

module.exports = { getUsers, updateProfile, getProfile, uploadAvatar, getUserById };
