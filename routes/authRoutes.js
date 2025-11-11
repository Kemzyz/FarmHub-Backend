const express = require('express');
const router = express.Router();
const { registerUser, loginFarmer, loginUser, requestEmailVerification, verifyEmail, requestPhoneOtp, verifyPhoneOtp, changePassword, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Route to register a new user is POST /api/auth/register
router.post('/register', registerUser);

// Route to login farmer POST /api/auth/farmer/login 
router.post('/farmer/login', loginFarmer);

// route to log in user POST /api/auth/login
router.post('/login', loginUser);

// Email verification
router.post('/request-email-verification', protect, requestEmailVerification);
router.post('/verify-email', verifyEmail); // supports body.token or query token

// Phone verification via OTP
router.post('/request-otp', protect, requestPhoneOtp);
router.post('/verify-otp', protect, verifyPhoneOtp);

// Password management
router.post('/change-password', protect, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
