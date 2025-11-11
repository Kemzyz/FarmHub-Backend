const mongoose = require('mongoose');

const supportRequestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    comment: { type: String, required: true },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SupportRequest', supportRequestSchema);