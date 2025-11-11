const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    // Owner (poster) of listing
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Buy/Sell intent
    intent: { type: String, enum: ['buy', 'sell'], required: true },

    // Core product fields
    name: { type: String, required: true },
    category: { type: String },
    location: { type: String },
    description: { type: String },

    // Quantity & units
    quantity: { type: Number },
    unit: { type: String },

    // Price range per unit
    priceMin: { type: Number },
    priceMax: { type: Number },

    // Availability window
    availableFrom: { type: Date },
    availableUntil: { type: Date },

    // Certifications
    organicCertified: { type: Boolean, default: false },
    qualityCertified: { type: Boolean, default: false },

    // Images (up to 5)
    images: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
