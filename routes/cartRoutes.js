const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getCart, addItem, updateItem, removeItem, checkout } = require('../controllers/cartController');

const router = express.Router();

router.get('/', protect, getCart);
router.post('/items', protect, addItem);
router.patch('/items/:productId', protect, updateItem);
router.delete('/items/:productId', protect, removeItem);
router.post('/checkout', protect, checkout);

module.exports = router;