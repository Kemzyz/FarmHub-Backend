const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// route   POST /api/auth/login  Login User
const loginUser = async (req, res) => {
  const { email, password } = req.body;
 
  try {
    // Check for user
      const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Return token
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

module.exports = { loginUser };
