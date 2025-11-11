const SupportRequest = require('../models/supportRequestModel');

// Submit support request
const submitSupport = async (req, res) => {
  try {
    const { name, email, phone, comment } = req.body;
    if (!name || !email || !comment) {
      return res.status(400).json({ message: 'name, email, and comment are required' });
    }
    const support = await SupportRequest.create({ name, email, phone, comment });
    res.status(201).json({ message: 'Support request submitted', support });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = { submitSupport };