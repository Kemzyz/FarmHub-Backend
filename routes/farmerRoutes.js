const express = require('express');
const router = express.Router();
const { registerFarmer, getFarmers } = require('../controllers/farmerController');

// Route for registerung a new farmer is POST /api/farmers/register
router.post('/register', registerFarmer);

//  Route for get farmers is GET /api/farmers
router.get('/', getFarmers);

module.exports = router;
