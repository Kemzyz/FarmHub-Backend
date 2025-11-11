const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  acceptOrder,
  startOrder,
  cancelOrder,
  confirmBuyer,
  confirmFarmer,
} = require('../controllers/orderController');

const router = express.Router();

router.post('/', protect, createOrder);
router.get('/', protect, getMyOrders);
router.get('/:id', protect, getOrderById);

router.patch('/:id/accept', protect, acceptOrder);
router.patch('/:id/start', protect, startOrder);
router.patch('/:id/cancel', protect, cancelOrder);
router.patch('/:id/confirm/buyer', protect, confirmBuyer);
router.patch('/:id/confirm/farmer', protect, confirmFarmer);

module.exports = router;