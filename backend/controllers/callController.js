const CallLog = require('../models/CallLog');
const User = require('../models/User');

/**
 * Get call history for the authenticated user
 * GET /api/calls
 */
const getCallHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const calls = await CallLog.find({
      $or: [{ caller: userId }, { receiver: userId }],
      status: { $ne: 'ringing' }, // Don't show calls still ringing
    })
      .populate('caller', 'username displayName avatar')
      .populate('receiver', 'username displayName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await CallLog.countDocuments({
      $or: [{ caller: userId }, { receiver: userId }],
      status: { $ne: 'ringing' },
    });

    // Map each call to include direction info
    const callHistory = calls.map((call) => {
      const isOutgoing = call.caller._id.toString() === userId;
      return {
        ...call,
        direction: isOutgoing ? 'outgoing' : 'incoming',
        otherUser: isOutgoing ? call.receiver : call.caller,
      };
    });

    res.json({
      calls: callHistory,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + limit < total,
      },
    });
  } catch (error) {
    console.error('Get call history error:', error);
    res.status(500).json({ message: 'Server error fetching call history.' });
  }
};

/**
 * Get favourite contacts for the authenticated user
 * GET /api/calls/favourites
 */
const getFavourites = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId)
      .populate('favouriteContacts', 'username displayName avatar status lastSeen')
      .lean();

    res.json(user?.favouriteContacts || []);
  } catch (error) {
    console.error('Get favourites error:', error);
    res.status(500).json({ message: 'Server error fetching favourites.' });
  }
};

/**
 * Add a contact to favourites
 * POST /api/calls/favourites/:userId
 */
const addFavourite = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { userId } = req.params;

    if (currentUserId === userId) {
      return res.status(400).json({ message: 'Cannot favourite yourself.' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const user = await User.findById(currentUserId);
    if (user.favouriteContacts.includes(userId)) {
      return res.status(400).json({ message: 'Already in favourites.' });
    }

    user.favouriteContacts.push(userId);
    await user.save();

    // Return the populated favourite
    await user.populate('favouriteContacts', 'username displayName avatar status lastSeen');
    res.json(user.favouriteContacts);
  } catch (error) {
    console.error('Add favourite error:', error);
    res.status(500).json({ message: 'Server error adding favourite.' });
  }
};

/**
 * Remove a contact from favourites
 * DELETE /api/calls/favourites/:userId
 */
const removeFavourite = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { userId } = req.params;

    const user = await User.findById(currentUserId);
    user.favouriteContacts = user.favouriteContacts.filter(
      (id) => id.toString() !== userId
    );
    await user.save();

    await user.populate('favouriteContacts', 'username displayName avatar status lastSeen');
    res.json(user.favouriteContacts);
  } catch (error) {
    console.error('Remove favourite error:', error);
    res.status(500).json({ message: 'Server error removing favourite.' });
  }
};

module.exports = { getCallHistory, getFavourites, addFavourite, removeFavourite };
