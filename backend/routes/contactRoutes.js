const express = require('express');
const {
  sendRequest,
  acceptRequest,
  rejectRequest,
  getContacts,
  getPendingRequests,
  getContactStatuses,
} = require('../controllers/contactController');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/contacts/request - Send contact request
router.post('/request', auth, sendRequest);

// PUT /api/contacts/accept/:requestId - Accept request
router.put('/accept/:requestId', auth, acceptRequest);

// PUT /api/contacts/reject/:requestId - Reject request
router.put('/reject/:requestId', auth, rejectRequest);

// GET /api/contacts - Get accepted contacts
router.get('/', auth, getContacts);

// GET /api/contacts/pending - Get pending incoming requests
router.get('/pending', auth, getPendingRequests);

// GET /api/contacts/statuses - Get all contact statuses
router.get('/statuses', auth, getContactStatuses);

module.exports = router;
