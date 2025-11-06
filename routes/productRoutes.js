const express = require('express');
const router = express.Router();
const { createProduct, getProducts, getProductById } = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const commentRoutes = require('./commentRoutes');

// Nested routes for comments
router.use('/:id/comments', commentRoutes);

// Products
router.get('/', getProducts);
router.post('/', protect, createProduct);
router.get('/:id', getProductById);

module.exports = router;
