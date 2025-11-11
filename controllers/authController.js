const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const crypto = require('crypto');
const { sendEmail } = require('../services/emailService');
const { sendSms } = require('../services/smsService');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// POST /api/auth/register  Register User
const registerUser = async (req, res) => {
  const { name, email, password, role, location, phone, country, address, farmname, language } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Validate role
    if (!['buyer', 'farmer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      location,
      phone,
      country,
      address,
      language,
      farmname,
      emailVerified: false,
      phoneVerified: false,
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location,
        phone: user.phone,
        country: user.country,
        address: user.address,
        language: user.language,
        farmname: user.farmname,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/farmer/login  Login Farmer
const loginFarmer = async (req, res) => {
  const { email, password } = req.body;
 try {
    const farmer = await User.findOne({ email, role: 'farmer' });
    if (!farmer) {
      return res.status(401).json({ message: 'farmer not found' });
    }
    //check password
    const isMatch = await bcrypt.compare(password, farmer.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    res.status(200).json({
      message: 'Login successful',
      farmer: {
        id: farmer._id,
        name: farmer.name,
        email: farmer.email,
        role: farmer.role,
        location: farmer.location,
        phone: farmer.phone,
      },
      token: generateToken(farmer._id),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
  
// POST /api/auth/login  Login User
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location,
        phone: user.phone,
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { registerUser, loginFarmer, loginUser};
// Request email verification
const requestEmailVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }
    const token = crypto.randomBytes(32).toString('hex');
    user.emailVerifyToken = token;
    user.emailVerifyExpires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h
    await user.save();
    const verifyUrl = `${process.env.APP_BASE_URL}/api/auth/verify-email?token=${token}`;
    await sendEmail({
      to: user.email,
      subject: 'Verify your FarmHub email',
      html: `<p>Hi ${user.name},</p><p>Click <a href="${verifyUrl}">here</a> to verify your email. This link expires in 24 hours.</p>`,
      text: `Verify your email: ${verifyUrl}`,
    });
    res.json({ message: 'Verification email sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Verify email
const verifyEmail = async (req, res) => {
  try {
    const token = req.query.token || req.body.token;
    if (!token) return res.status(400).json({ message: 'Token required' });
    const user = await User.findOne({ emailVerifyToken: token, emailVerifyExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });
    user.emailVerified = true;
    user.emailVerifyToken = undefined;
    user.emailVerifyExpires = undefined;
    await user.save();
    res.json({ message: 'Email verified' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Request phone OTP
const requestPhoneOtp = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.phone) return res.status(400).json({ message: 'Phone number not set' });
    if (user.phoneVerified) return res.status(400).json({ message: 'Phone already verified' });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.phoneOtp = otp;
    user.phoneOtpExpires = new Date(Date.now() + 1000 * 60 * 10); // 10 min
    await user.save();
    await sendSms({ to: user.phone, body: `Your FarmHub OTP is ${otp}. Valid for 10 minutes.` });
    res.json({ message: 'OTP sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Verify phone OTP
const verifyPhoneOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ message: 'OTP required' });
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.phoneOtp || !user.phoneOtpExpires || user.phoneOtpExpires < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    if (user.phoneOtp !== otp) return res.status(400).json({ message: 'Incorrect OTP' });
    user.phoneVerified = true;
    user.phoneOtp = undefined;
    user.phoneOtpExpires = undefined;
    await user.save();
    res.json({ message: 'Phone verified' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Change password (authenticated)
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Current password incorrect' });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    res.json({ message: 'Password changed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Forgot password (send reset link)
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(200).json({ message: 'If the email exists, a reset link was sent' });
    const token = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = token;
    user.passwordResetExpires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
    await user.save();
    const resetUrl = `${process.env.APP_BASE_URL}/api/auth/reset-password?token=${token}`;
    await sendEmail({
      to: user.email,
      subject: 'Reset your FarmHub password',
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
      text: `Reset your password: ${resetUrl}`,
    });
    res.json({ message: 'If the email exists, a reset link was sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reset password (by token)
const resetPassword = async (req, res) => {
  try {
    const token = req.query.token || req.body.token;
    const { newPassword } = req.body;
    if (!token) return res.status(400).json({ message: 'Token required' });
    const user = await User.findOne({ passwordResetToken: token, passwordResetExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  registerUser,
  loginFarmer,
  loginUser,
  requestEmailVerification,
  verifyEmail,
  requestPhoneOtp,
  verifyPhoneOtp,
  changePassword,
  forgotPassword,
  resetPassword,
};
