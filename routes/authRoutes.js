const express = require('express');
const router = express.Router();
const { registerUser, loginFarmer, loginUser } = require('../controllers/authController');

// Route to register a new user is POST /api/auth/register
router.post('/register', registerUser);

// Route to login farmer POST /api/auth/farmer/login 
router.post('/farmer/login', loginFarmer);

// route to log in user POST /api/auth/login
router.post('/login', loginUser);

module.exports = router;
