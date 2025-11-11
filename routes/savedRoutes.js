const express = require('express');
const router = express.Router();
const { addSavedItem, getSavedItems, deleteSavedItem } = require('../controllers/savedController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, addSavedItem);
router.get('/', protect, getSavedItems);
router.delete('/:id', protect, deleteSavedItem);

module.exports = router;