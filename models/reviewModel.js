const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'subjectModel' },
    subjectModel: { type: String, required: true, enum: ['Product', 'User'] },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String },
  },
  { timestamps: true }
);

reviewSchema.index({ author: 1, subject: 1, subjectModel: 1 }, { unique: false });

module.exports = mongoose.model('Review', reviewSchema);