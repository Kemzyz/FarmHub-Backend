const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 }, // snapshot at order time
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['requested', 'accepted', 'in_progress', 'cancelled', 'completed'], default: 'requested' },
    buyerConfirmed: { type: Boolean, default: false },
    farmerConfirmed: { type: Boolean, default: false },
    cancellationReason: { type: String },
    cancelledByRole: { type: String, enum: ['buyer', 'farmer'] },
    cancelledAt: { type: Date },
    note: { type: String },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);