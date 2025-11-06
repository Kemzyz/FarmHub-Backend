const Comment = require('../models/commentModel');

// Add new comment
const addComment = async (req, res) => {
  try {
    const comment = await Comment.create({
      product: req.params.id,
      user: req.user.id,
      content: req.body.content
    });
    res.status(201).json(comment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get comments for a product
const getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ product: req.params.id })
      .populate('user', 'name');
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { addComment, getComments };
