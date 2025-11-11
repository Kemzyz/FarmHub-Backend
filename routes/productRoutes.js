const express = require('express');
const router = express.Router();
const { createProduct, getProducts, getProductById, updateProduct, deleteProduct } = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const commentRoutes = require('./commentRoutes');
const upload = require('../middleware/uploadMiddleware');

// Nested routes for comments
router.use('/:id/comments', commentRoutes);

// Create a Product with multi-image upload (up to 5)
router.post('/', protect, upload.array('images', 5), createProduct);

// Get all Products
router.get('/', getProducts);

// Get a single Product by ID
router.get('/:id', getProductById);

// Update a Product
router.put('/:id', protect, updateProduct);

// Delete a Product
router.delete('/:id', protect, deleteProduct);


module.exports = router;
