const express = require('express');
const router = express.Router({ mergeParams: true });
const { addComment, getComments } = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

// Add a comment to a product
router.post('/', protect, addComment);

// Get comments for a product
router.get('/', getComments);

module.exports = router;
