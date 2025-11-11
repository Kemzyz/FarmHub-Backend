const Product = require('../models/productModel');

// Create a new product (supports up to 5 images) with role/intent checks
const createProduct = async (req, res) => {
  try {
    const {
      name,
      category,
      description,
      location,
      quantity,
      unit,
      priceMin,
      priceMax,
      availableFrom,
      availableUntil,
      organicCertified,
      qualityCertified,
      intent,
    } = req.body;

    // Enforce role: buyers cannot create sell intent listings
    if (intent === 'sell' && req.user.role !== 'farmer') {
      return res.status(403).json({ message: 'Only farmers can create sell listings' });
    }

    // Collect uploaded image paths (if any)
    const images = Array.isArray(req.files)
      ? req.files.map((f) => `/uploads/${f.filename}`)
      : [];

    const product = await Product.create({
      owner: req.user.id,
      intent,
      name,
      category,
      description,
      location,
      quantity,
      unit,
      priceMin,
      priceMax,
      availableFrom,
      availableUntil,
      organicCertified,
      qualityCertified,
      images,
    });

    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all products with filters and search
const getProducts = async (req, res) => {
  try {
    const {
      q,
      category,
      location,
      intent,
      organicCertified,
      qualityCertified,
      unit,
      priceMin,
      priceMax,
      availableFrom,
      availableUntil,
    } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (location) filter.location = location;
    if (intent) filter.intent = intent;
    if (unit) filter.unit = unit;
    if (typeof organicCertified !== 'undefined') filter.organicCertified = organicCertified === 'true';
    if (typeof qualityCertified !== 'undefined') filter.qualityCertified = qualityCertified === 'true';

    // Price range
    if (priceMin || priceMax) {
      filter.$and = [
        ...(filter.$and || []),
        {
          ...(priceMin ? { priceMin: { $gte: Number(priceMin) } } : {}),
          ...(priceMax ? { priceMax: { $lte: Number(priceMax) } } : {}),
        },
      ];
    }

    // Availability window overlap
    if (availableFrom || availableUntil) {
      const fromDate = availableFrom ? new Date(availableFrom) : undefined;
      const untilDate = availableUntil ? new Date(availableUntil) : undefined;
      if (fromDate || untilDate) {
        filter.$and = [
          ...(filter.$and || []),
          {
            ...(fromDate ? { availableUntil: { $gte: fromDate } } : {}),
            ...(untilDate ? { availableFrom: { $lte: untilDate } } : {}),
          },
        ];
      }
    }

    // Text search
    if (q) {
      const regex = new RegExp(q, 'i');
      filter.$or = [{ name: regex }, { description: regex }, { category: regex }, { location: regex }];
    }

    const products = await Product.find(filter).populate('owner', 'name location role');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single product
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('owner', 'name location role');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update Product (owner-only)
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (String(product.owner) !== String(req.user.id)) {
      return res.status(403).json({ message: 'You do not own this product' });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: 'Product updated successfully',
      updatedProduct,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete Product (owner-only)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (String(product.owner) !== String(req.user.id)) {
      return res.status(403).json({ message: 'You do not own this product' });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

    
module.exports = { createProduct, getProducts, getProductById, updateProduct, deleteProduct };
