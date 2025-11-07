const Product = require('../models/productModel');

// Create a new product
const createProduct = async (req, res) => {
  try {
    const product = await Product.create({
      ...req.body,
      seller: req.user.id
    });
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all products
const getProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('seller', 'name location');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single product
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller', 'name location');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update Product
const updateProduct = async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
       req.body,
        { new: true, runValidators: true }
      );

        if(!updatedProduct) {
          return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({
          message: 'Product updated successfully',
          updatedProduct
        });
     }  catch (error) {
      res.status(400).json({ message: error.message });
     }
    };

    // Delete Product
const deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


module.exports = { createProduct, getProducts, getProductById, updateProduct, deleteProduct};
