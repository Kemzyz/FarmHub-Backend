const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  location: String,
  farmType: String
}, { timestamps: true });

module.exports = mongoose.model('Farmer', farmerSchema);
