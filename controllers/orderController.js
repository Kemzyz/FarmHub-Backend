const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const notifications = require('../services/notificationService');

// Helper to ensure only one farmer per order
function ensureSingleFarmer(products) {
  const owners = products.map((p) => String(p.owner));
  const unique = [...new Set(owners)];
  return unique.length === 1 ? unique[0] : null;
}

exports.createOrder = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    if (req.user.role !== 'buyer') return res.status(403).json({ message: 'Only buyers can create orders' });

    const { items = [], note } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items are required' });
    }

    // Load products and validate
    const productIds = items.map((it) => it.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    if (products.length !== items.length) {
      return res.status(404).json({ message: 'One or more products not found' });
    }

    // Ensure all items belong to the same farmer (owner)
    const farmerId = ensureSingleFarmer(products);
    if (!farmerId) {
      return res.status(400).json({ message: 'All items must belong to the same farmer' });
    }

    // Build order items with snapshot pricing (use priceMin if provided)
    const orderItems = items.map((it) => {
      const product = products.find((p) => String(p._id) === String(it.productId));
      const quantity = Number(it.quantity) || 1;
      const unitPrice = Number(product.priceMin || 0);
      return { product: product._id, quantity, unitPrice };
    });

    const subtotal = orderItems.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);

    const order = await Order.create({
      buyer: req.user._id,
      farmer: farmerId,
      items: orderItems,
      subtotal,
      status: 'requested',
      note,
    });

    const populated = await Order.findById(order._id)
      .populate('buyer', 'name email')
      .populate('farmer', 'name email')
      .populate('items.product', 'name images');

    // Notify buyer and farmer
    await notifications.notifyOrderCreated(populated);
    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create order' });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const { status } = req.query;
    const query = {};
    if (req.user.role === 'buyer') query.buyer = req.user._id;
    else if (req.user.role === 'farmer') query.farmer = req.user._id;
    else return res.status(400).json({ message: 'Unknown role' });
    if (status) query.status = status;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .populate('buyer', 'name email')
      .populate('farmer', 'name email')
      .populate('items.product', 'name images');

    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const order = await Order.findById(req.params.id)
      .populate('buyer', 'name email')
      .populate('farmer', 'name email')
      .populate('items.product', 'name images');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (String(order.buyer) !== String(req.user._id) && String(order.farmer) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch order' });
  }
};

exports.acceptOrder = async (req, res) => {
  try {
    if (req.user.role !== 'farmer') return res.status(403).json({ message: 'Only farmers can accept orders' });
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (String(order.farmer) !== String(req.user._id)) return res.status(403).json({ message: 'Not your order' });
    if (order.status !== 'requested') return res.status(400).json({ message: 'Order not in requested state' });
    order.status = 'accepted';
    await order.save();
    const populated = await Order.findById(order._id)
      .populate('buyer', 'name email phone')
      .populate('farmer', 'name email phone')
      .populate('items.product', 'name images');
    await notifications.notifyOrderAccepted(populated);
    res.json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to accept order' });
  }
};

exports.startOrder = async (req, res) => {
  try {
    if (req.user.role !== 'farmer') return res.status(403).json({ message: 'Only farmers can start orders' });
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (String(order.farmer) !== String(req.user._id)) return res.status(403).json({ message: 'Not your order' });
    if (!['accepted'].includes(order.status)) return res.status(400).json({ message: 'Order not in accepted state' });
    order.status = 'in_progress';
    await order.save();
    const populated = await Order.findById(order._id)
      .populate('buyer', 'name email phone')
      .populate('farmer', 'name email phone')
      .populate('items.product', 'name images');
    await notifications.notifyOrderStarted(populated);
    res.json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to start order' });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (String(order.buyer) !== String(req.user._id) && String(order.farmer) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to cancel' });
    }
    if (order.status === 'completed' || order.status === 'cancelled') {
      return res.status(400).json({ message: 'Order already finalized' });
    }
    const { reason } = req.body;
    order.status = 'cancelled';
    order.cancellationReason = reason;
    order.cancelledByRole = req.user.role;
    order.cancelledAt = new Date();
    await order.save();
    const populated = await Order.findById(order._id)
      .populate('buyer', 'name email phone')
      .populate('farmer', 'name email phone')
      .populate('items.product', 'name images');
    await notifications.notifyOrderCancelled(populated);
    res.json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to cancel order' });
  }
};

exports.confirmBuyer = async (req, res) => {
  try {
    if (req.user.role !== 'buyer') return res.status(403).json({ message: 'Only buyers can confirm completion' });
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (String(order.buyer) !== String(req.user._id)) return res.status(403).json({ message: 'Not your order' });
    if (!['in_progress', 'accepted'].includes(order.status)) return res.status(400).json({ message: 'Order not in progress' });
    order.buyerConfirmed = true;
    if (order.farmerConfirmed) {
      order.status = 'completed';
      order.completedAt = new Date();
    }
    await order.save();
    const populated = await Order.findById(order._id)
      .populate('buyer', 'name email phone')
      .populate('farmer', 'name email phone')
      .populate('items.product', 'name images');
    if (populated.status === 'completed') {
      await notifications.notifyOrderCompleted(populated);
    }
    res.json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to confirm' });
  }
};

exports.confirmFarmer = async (req, res) => {
  try {
    if (req.user.role !== 'farmer') return res.status(403).json({ message: 'Only farmers can confirm completion' });
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (String(order.farmer) !== String(req.user._id)) return res.status(403).json({ message: 'Not your order' });
    if (!['in_progress', 'accepted'].includes(order.status)) return res.status(400).json({ message: 'Order not in progress' });
    order.farmerConfirmed = true;
    if (order.buyerConfirmed) {
      order.status = 'completed';
      order.completedAt = new Date();
    }
    await order.save();
    const populated = await Order.findById(order._id)
      .populate('buyer', 'name email phone')
      .populate('farmer', 'name email phone')
      .populate('items.product', 'name images');
    if (populated.status === 'completed') {
      await notifications.notifyOrderCompleted(populated);
    }
    res.json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to confirm' });
  }
};