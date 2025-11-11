const Review = require('../models/reviewModel');

// Create a review
const createReview = async (req, res) => {
  try {
    const { subjectId, type, rating, comment } = req.body;
    if (!['product', 'user'].includes(type)) {
      return res.status(400).json({ message: 'Invalid type' });
    }
    const subjectModel = type === 'product' ? 'Product' : 'User';
    const review = await Review.create({
      author: req.user.id,
      subject: subjectId,
      subjectModel,
      rating,
      comment,
    });
    res.status(201).json({ message: 'Review created', review });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get reviews for subject
const getReviews = async (req, res) => {
  try {
    const { subjectId, type } = req.query;
    if (!subjectId || !type) return res.status(400).json({ message: 'subjectId and type required' });
    if (!['product', 'user'].includes(type)) {
      return res.status(400).json({ message: 'Invalid type' });
    }
    const subjectModel = type === 'product' ? 'Product' : 'User';
    const reviews = await Review.find({ subject: subjectId, subjectModel }).populate('author', 'name role');
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createReview, getReviews };