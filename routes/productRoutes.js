const express = require('express');
const router = express.Router();
const { createProduct, getProducts, getProductById, updateProduct, deleteProduct } = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const commentRoutes = require('./commentRoutes');

// Nested routes for comments
router.use('/:id/comments', commentRoutes);

// Create a Product
router.post('/', protect, createProduct);

// Get all Products
router.get('/', getProducts);

// Get a single Product by ID
router.get('/:id', getProductById);

module.exports = router;
