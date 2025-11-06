const Farmer = require('../models/farmerModel');

// Register a new farmer
const registerFarmer = async (req, res) => {
  try {
    const farmer = await Farmer.create(req.body);
    res.status(201).json(farmer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all farmers
const getFarmers = async (req, res) => {
  try {
    const farmers = await Farmer.find();
    res.json(farmers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { registerFarmer, getFarmers };
