const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Get all users
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getUsers };
// Get a single public user profile
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -emailVerifyToken -passwordResetToken -phoneOtp');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update own profile
const updateUser = async (req, res) => {
  try {
    if (String(req.user._id) !== String(req.params.id)) {
      return res.status(403).json({ message: 'You can only update your profile' });
    }
    const allowed = ['name', 'country', 'address', 'location', 'language', 'phone', 'farmname'];
    const update = {};
    for (const key of allowed) {
      if (typeof req.body[key] !== 'undefined') update[key] = req.body[key];
    }
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).select('-password');
    res.json({ message: 'Profile updated', user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update avatar (upload)
const updateAvatar = async (req, res) => {
  try {
    if (String(req.user._id) !== String(req.params.id)) {
      return res.status(403).json({ message: 'You can only update your avatar' });
    }
    if (!req.file) return res.status(400).json({ message: 'Avatar file required' });
    const avatarPath = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.params.id, { avatarPath }, { new: true }).select('-password');
    res.json({ message: 'Avatar updated', user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = { getUsers, getUserById, updateUser, updateAvatar };
