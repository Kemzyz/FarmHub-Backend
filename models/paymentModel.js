const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: String, enum: ['flutterwave', 'paga'], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    status: { type: String, enum: ['pending', 'successful', 'failed', 'cancelled'], default: 'pending' },
    providerRef: { type: String },
    webhookPayload: { type: Object },
  },
  { timestamps: true }
);

paymentSchema.index({ provider: 1, providerRef: 1 });

module.exports = mongoose.model('Payment', paymentSchema);