const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  category: String,
  price: { type: Number, required: true },
  description: String,
  imageUrl: String,
  location: String
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
