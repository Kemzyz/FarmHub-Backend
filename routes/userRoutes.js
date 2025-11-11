const express = require('express');
const router = express.Router();
const { getUsers } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Get all users (protected)
router.get('/', protect, getUsers);

module.exports = router;
