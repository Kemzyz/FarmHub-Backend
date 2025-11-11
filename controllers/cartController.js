const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');

function ensureSingleFarmer(products) {
  const owners = products.map((p) => String(p.owner));
  const unique = [...new Set(owners)];
  return unique.length === 1 ? unique[0] : null;
}

exports.getCart = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    let cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'name images owner');
    if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });
    res.json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to get cart' });
  }
};

exports.addItem = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId) return res.status(400).json({ message: 'productId is required' });
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });

    const idx = cart.items.findIndex((it) => String(it.product) === String(productId));
    if (idx >= 0) {
      cart.items[idx].quantity += Number(quantity) || 1;
    } else {
      cart.items.push({ product: productId, quantity: Number(quantity) || 1 });
    }
    await cart.save();

    const populated = await Cart.findById(cart._id).populate('items.product', 'name images owner');
    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to add item' });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });
    const idx = cart.items.findIndex((it) => String(it.product) === String(productId));
    if (idx < 0) return res.status(404).json({ message: 'Item not in cart' });
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      cart.items.splice(idx, 1);
    } else {
      cart.items[idx].quantity = qty;
    }
    await cart.save();
    const populated = await Cart.findById(cart._id).populate('items.product', 'name images owner');
    res.json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update item' });
  }
};

exports.removeItem = async (req, res) => {
  try {
    const { productId } = req.params;
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });
    cart.items = cart.items.filter((it) => String(it.product) !== String(productId));
    await cart.save();
    const populated = await Cart.findById(cart._id).populate('items.product', 'name images owner');
    res.json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to remove item' });
  }
};

exports.checkout = async (req, res) => {
  try {
    if (req.user.role !== 'buyer') return res.status(403).json({ message: 'Only buyers can checkout' });
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) return res.status(400).json({ message: 'Cart is empty' });

    const products = cart.items.map((it) => it.product);
    const farmerId = ensureSingleFarmer(products);
    if (!farmerId) {
      return res.status(400).json({ message: 'Cart contains items from multiple farmers' });
    }

    const orderItems = cart.items.map((it) => ({
      product: it.product._id,
      quantity: it.quantity,
      unitPrice: Number(it.product.priceMin || 0),
    }));
    const subtotal = orderItems.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
    const order = await Order.create({
      buyer: req.user._id,
      farmer: farmerId,
      items: orderItems,
      subtotal,
      status: 'requested',
    });

    // Clear cart after successful checkout
    cart.items = [];
    await cart.save();

    const populated = await Order.findById(order._id)
      .populate('buyer', 'name email')
      .populate('farmer', 'name email')
      .populate('items.product', 'name images');
    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to checkout' });
  }
};