const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    participants: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      validate: [arr => arr.length === 2, 'Conversation must have exactly 2 participants'],
      required: true,
    },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    lastMessageAt: { type: Date },
    lastMessageSnippet: { type: String },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1, order: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);