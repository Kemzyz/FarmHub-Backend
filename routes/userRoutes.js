const express = require('express');
const router = express.Router();
const { getUsers, getUserById, updateUser, updateAvatar } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');

// Get all users (protected)
router.get('/', protect, getUsers);
router.get('/:id', getUserById);
router.patch('/:id', protect, updateUser);
router.patch('/:id/avatar', protect, upload.single('avatar'), updateAvatar);

module.exports = router;
