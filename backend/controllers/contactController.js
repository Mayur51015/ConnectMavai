const ContactRequest = require('../models/ContactRequest');
const User = require('../models/User');

/**
 * Send a contact request
 * POST /api/contacts/request
 */
const sendRequest = async (req, res) => {
  try {
    const { toUserId } = req.body;
    const fromUserId = req.user.id;

    if (fromUserId === toUserId) {
      return res.status(400).json({ message: 'Cannot send request to yourself.' });
    }

    // Check for existing request in either direction
    const existing = await ContactRequest.findOne({
      $or: [
        { from: fromUserId, to: toUserId },
        { from: toUserId, to: fromUserId },
      ],
    });

    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(400).json({ message: 'Already contacts.' });
      }
      if (existing.status === 'pending') {
        return res.status(400).json({ message: 'Request already pending.' });
      }
      // If rejected, allow re-sending by updating
      existing.status = 'pending';
      existing.from = fromUserId;
      existing.to = toUserId;
      await existing.save();
      return res.status(200).json(existing);
    }

    const request = new ContactRequest({
      from: fromUserId,
      to: toUserId,
    });

    await request.save();
    await request.populate('from', 'username displayName avatar');
    await request.populate('to', 'username displayName avatar');

    res.status(201).json(request);
  } catch (error) {
    console.error('Send request error:', error);
    res.status(500).json({ message: 'Server error sending contact request.' });
  }
};

/**
 * Accept a contact request
 * PUT /api/contacts/accept/:requestId
 */
const acceptRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const currentUserId = req.user.id;

    const request = await ContactRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: 'Request not found.' });
    if (request.to.toString() !== currentUserId) {
      return res.status(403).json({ message: 'Only the recipient can accept.' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request is no longer pending.' });
    }

    request.status = 'accepted';
    await request.save();
    await request.populate('from', 'username displayName avatar');
    await request.populate('to', 'username displayName avatar');

    res.json(request);
  } catch (error) {
    console.error('Accept request error:', error);
    res.status(500).json({ message: 'Server error accepting request.' });
  }
};

/**
 * Reject a contact request
 * PUT /api/contacts/reject/:requestId
 */
const rejectRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const currentUserId = req.user.id;

    const request = await ContactRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: 'Request not found.' });
    if (request.to.toString() !== currentUserId) {
      return res.status(403).json({ message: 'Only the recipient can reject.' });
    }

    request.status = 'rejected';
    await request.save();

    res.json({ message: 'Request rejected.' });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ message: 'Server error rejecting request.' });
  }
};

/**
 * Get accepted contacts for current user
 * GET /api/contacts
 */
const getContacts = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const contacts = await ContactRequest.find({
      status: 'accepted',
      $or: [{ from: currentUserId }, { to: currentUserId }],
    })
      .populate('from', 'username displayName avatar status lastSeen')
      .populate('to', 'username displayName avatar status lastSeen')
      .lean();

    // Return the other user in each contact pair
    const contactUsers = contacts.map((c) => {
      const otherUser = c.from._id.toString() === currentUserId ? c.to : c.from;
      return otherUser;
    });

    res.json(contactUsers);
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ message: 'Server error fetching contacts.' });
  }
};

/**
 * Get pending incoming requests for current user
 * GET /api/contacts/pending
 */
const getPendingRequests = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const pending = await ContactRequest.find({
      to: currentUserId,
      status: 'pending',
    })
      .populate('from', 'username displayName avatar')
      .sort({ createdAt: -1 })
      .lean();

    res.json(pending);
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({ message: 'Server error fetching pending requests.' });
  }
};

/**
 * Get all contact request statuses involving the current user
 * GET /api/contacts/statuses
 */
const getContactStatuses = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const requests = await ContactRequest.find({
      $or: [{ from: currentUserId }, { to: currentUserId }],
    }).lean();

    // Build a map: userId -> { status, requestId, direction }
    const statuses = {};
    requests.forEach((r) => {
      const otherId = r.from.toString() === currentUserId ? r.to.toString() : r.from.toString();
      statuses[otherId] = {
        status: r.status,
        requestId: r._id,
        direction: r.from.toString() === currentUserId ? 'sent' : 'received',
      };
    });

    res.json(statuses);
  } catch (error) {
    console.error('Get contact statuses error:', error);
    res.status(500).json({ message: 'Server error fetching contact statuses.' });
  }
};

module.exports = { sendRequest, acceptRequest, rejectRequest, getContacts, getPendingRequests, getContactStatuses };
