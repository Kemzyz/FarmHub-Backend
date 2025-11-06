const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUsers } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Route to register a new user is POST /api/users/register
router.post('/register', registerUser);

// Route to Login POST /api/users/login
router.post('/login', loginUser);

// Get all users (protected)
router.get('/', protect, getUsers);

module.exports = router;
