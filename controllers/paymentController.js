const Order = require('../models/orderModel');
const Payment = require('../models/paymentModel');
const notifications = require('../services/notificationService');

function getCurrency() {
  return process.env.PAYMENTS_CURRENCY || 'USD';
}

// Initiate Flutterwave payment (returns payload for client-side checkout)
exports.initiateFlutterwave = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    if (req.user.role !== 'buyer') return res.status(403).json({ message: 'Only buyers can initiate payments' });
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: 'orderId is required' });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (String(order.buyer) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not your order' });
    }

    const amount = Number(order.subtotal || 0);
    const currency = getCurrency();
    const providerRef = `FLW-${order._id}-${Date.now()}`;

    const payment = await Payment.create({
      order: order._id,
      buyer: order.buyer,
      farmer: order.farmer,
      provider: 'flutterwave',
      amount,
      currency,
      status: 'pending',
      providerRef,
    });

    res.status(201).json({
      paymentId: payment._id,
      provider: 'flutterwave',
      publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY,
      amount,
      currency,
      orderId: String(order._id),
      tx_ref: providerRef,
      // Frontend should use Flutterwave inline/checkout and pass tx_ref
      // Optionally, your frontend may redirect to a hosted payment link
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to initiate Flutterwave payment' });
  }
};

// Flutterwave webhook
exports.flutterwaveWebhook = async (req, res) => {
  try {
    const headerHash = req.headers['verif-hash'] || req.headers['Verif-Hash'] || req.headers['VERIF-HASH'];
    const expected = process.env.FLUTTERWAVE_SECRET_HASH || process.env.FLUTTERWAVE_SECRET_KEY;
    if (!expected || !headerHash || headerHash !== expected) {
      return res.status(403).json({ message: 'Invalid webhook signature' });
    }

    const payload = req.body || {};
    const data = payload.data || payload;
    const txRef = data.tx_ref || data.txRef || data.tx_reference;
    const status = (data.status || payload.status || '').toLowerCase();

    if (!txRef) {
      return res.status(400).json({ message: 'Missing tx_ref' });
    }
    const payment = await Payment.findOne({ provider: 'flutterwave', providerRef: txRef });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    payment.webhookPayload = payload;
    if (status.includes('success')) {
      payment.status = 'successful';
    } else if (status.includes('fail')) {
      payment.status = 'failed';
    }
    await payment.save();

    // Populate for notifications
    const populated = await Payment.findById(payment._id)
      .populate({
        path: 'order',
        populate: [
          { path: 'buyer', select: 'name email phone' },
          { path: 'farmer', select: 'name email phone' },
          { path: 'items.product', select: 'name images' },
        ],
      })
      .populate('buyer', 'name email phone')
      .populate('farmer', 'name email phone');

    if (payment.status === 'successful') {
      await notifications.notifyPaymentSuccessful(populated);
    } else if (payment.status === 'failed') {
      await notifications.notifyPaymentFailed(populated);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Webhook handling failed' });
  }
};

// Initiate Paga payment (returns payload for client-side or server-side initiation)
exports.initiatePaga = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    if (req.user.role !== 'buyer') return res.status(403).json({ message: 'Only buyers can initiate payments' });
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: 'orderId is required' });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (String(order.buyer) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not your order' });
    }

    const amount = Number(order.subtotal || 0);
    const currency = getCurrency();
    const providerRef = `PAGA-${order._id}-${Date.now()}`;

    const payment = await Payment.create({
      order: order._id,
      buyer: order.buyer,
      farmer: order.farmer,
      provider: 'paga',
      amount,
      currency,
      status: 'pending',
      providerRef,
    });

    res.status(201).json({
      paymentId: payment._id,
      provider: 'paga',
      username: process.env.PAGA_USERNAME,
      baseUrl: process.env.PAGA_BASE_URL,
      amount,
      currency,
      orderId: String(order._id),
      reference: providerRef,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to initiate Paga payment' });
  }
};

// Paga webhook (simple token verification)
exports.pagaWebhook = async (req, res) => {
  try {
    const token = req.query.token || req.headers['x-webhook-token'];
    const expected = process.env.PAGA_WEBHOOK_TOKEN;
    if (!expected || !token || token !== expected) {
      return res.status(403).json({ message: 'Invalid webhook token' });
    }

    const payload = req.body || {};
    const ref = payload.reference || payload.tx_ref || payload.txRef;
    const statusRaw = (payload.status || '').toLowerCase();

    if (!ref) return res.status(400).json({ message: 'Missing reference' });
    const payment = await Payment.findOne({ provider: 'paga', providerRef: ref });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    payment.webhookPayload = payload;
    if (statusRaw.includes('success')) payment.status = 'successful';
    else if (statusRaw.includes('fail') || statusRaw.includes('error')) payment.status = 'failed';
    await payment.save();

    // Populate for notifications
    const populated = await Payment.findById(payment._id)
      .populate({
        path: 'order',
        populate: [
          { path: 'buyer', select: 'name email phone' },
          { path: 'farmer', select: 'name email phone' },
          { path: 'items.product', select: 'name images' },
        ],
      })
      .populate('buyer', 'name email phone')
      .populate('farmer', 'name email phone');

    if (payment.status === 'successful') {
      await notifications.notifyPaymentSuccessful(populated);
    } else if (payment.status === 'failed') {
      await notifications.notifyPaymentFailed(populated);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Webhook handling failed' });
  }
};

// Get payment by id (buyer or farmer on the order)
exports.getPaymentById = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const payment = await Payment.findById(req.params.id).populate({
      path: 'order',
      populate: [
        { path: 'buyer', select: 'name email' },
        { path: 'farmer', select: 'name email' },
        { path: 'items.product', select: 'name images' },
      ],
    });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (String(payment.buyer) !== String(req.user._id) && String(payment.farmer) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to view this payment' });
    }
    res.json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch payment' });
  }
};