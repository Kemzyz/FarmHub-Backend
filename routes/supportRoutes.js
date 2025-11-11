const express = require('express');
const router = express.Router();
const { submitSupport } = require('../controllers/supportController');

// Public support form endpoint
router.post('/', submitSupport);

module.exports = router;