const express = require('express');
const multer = require('multer');
const path = require('path');
const { getMessages, markAsSeen, editMessage, deleteMessage, deleteChat, uploadFile } = require('../controllers/messageController');
const auth = require('../middleware/auth');

const router = express.Router();

// Multer config for file uploads (images, PDFs, voice)
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'files'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user.id}-${Date.now()}${ext}`);
  },
});

const fileUpload = multer({
  storage: fileStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|webm|ogg|mp3|wav|m4a/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const allowedMimes = /image\/(jpeg|png|gif|webp)|application\/pdf|audio\/(webm|ogg|mpeg|wav|mp4|x-m4a)/;
    const mime = allowedMimes.test(file.mimetype);
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error('Only images (jpg, png, gif, webp), PDFs, and audio files are allowed.'));
    }
  },
});

// POST /api/messages/upload - Upload a file for chat
router.post('/upload', auth, fileUpload.single('file'), uploadFile);

// DELETE /api/messages/chat/:userId - Delete entire chat with a user
router.delete('/chat/:userId', auth, deleteChat);

// PUT /api/messages/:messageId - Edit a message
router.put('/:messageId', auth, editMessage);

// DELETE /api/messages/:messageId - Delete a single message
router.delete('/:messageId', auth, deleteMessage);

// PUT /api/messages/seen - Mark messages from a sender as seen
router.put('/seen', auth, markAsSeen);

// GET /api/messages/:userId - Get messages between current user and userId (paginated)
router.get('/:userId', auth, getMessages);

module.exports = router;
