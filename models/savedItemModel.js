const mongoose = require('mongoose');

const savedItemSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['product', 'user'], required: true },
    target: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'targetModel' },
    targetModel: { type: String, required: true, enum: ['Product', 'User'] },
  },
  { timestamps: true }
);

savedItemSchema.index({ user: 1, type: 1, target: 1 }, { unique: true });

module.exports = mongoose.model('SavedItem', savedItemSchema);