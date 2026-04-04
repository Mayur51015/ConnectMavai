const express = require('express');
const { getCallHistory, getFavourites, addFavourite, removeFavourite } = require('../controllers/callController');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/calls - Get call history (paginated)
router.get('/', auth, getCallHistory);

// GET /api/calls/favourites - Get favourite contacts
router.get('/favourites', auth, getFavourites);

// POST /api/calls/favourites/:userId - Add to favourites
router.post('/favourites/:userId', auth, addFavourite);

// DELETE /api/calls/favourites/:userId - Remove from favourites
router.delete('/favourites/:userId', auth, removeFavourite);

module.exports = router;
