const express = require('express');
const multer = require('multer');
const path = require('path');
const { getUsers, updateProfile, getProfile, uploadAvatar, getUserById } = require('../controllers/userController');
const auth = require('../middleware/auth');

const router = express.Router();

// Multer config for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'avatars'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user.id}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpg, png, gif, webp) are allowed.'));
    }
  },
});

// GET /api/users/profile - Get current user profile
router.get('/profile', auth, getProfile);

// PUT /api/users/profile - Update current user profile
router.put('/profile', auth, updateProfile);

// POST /api/users/avatar - Upload profile picture
router.post('/avatar', auth, upload.single('avatar'), uploadAvatar);

// GET /api/users/:userId - Get a user's public profile
router.get('/:userId', auth, getUserById);

// GET /api/users - Get all users except current (requires auth)
router.get('/', auth, getUsers);

module.exports = router;
