const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  initiateFlutterwave,
  flutterwaveWebhook,
  initiatePaga,
  pagaWebhook,
  getPaymentById,
} = require('../controllers/paymentController');

const router = express.Router();

// Initiation endpoints (auth required)
router.post('/flutterwave/initiate', protect, initiateFlutterwave);
router.post('/paga/initiate', protect, initiatePaga);

// Webhooks (public, verified internally)
router.post('/flutterwave/webhook', flutterwaveWebhook);
router.post('/paga/webhook', pagaWebhook);

// Get payment (auth)
router.get('/:id', protect, getPaymentById);

module.exports = router;