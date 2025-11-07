const express = require('express');
const router = express.Router();
const { createProduct, getProducts, getProductById, updateProduct, deleteProduct} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const commentRoutes = require('./commentRoutes');

// Nested routes for comments
router.use('/:id/comments', commentRoutes);

// Create a Product
router.post('/', protect, createProduct);

// Get all Products
router.get('/', getProducts);

// Get all Products by ID
router.get('/:id', getProductById);


// Update a Product
router.put('/:id', protect, updateProduct);

// Delete a Product
router.delete('/:id', protect, deleteProduct);


module.exports = router;
