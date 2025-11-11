const SavedItem = require('../models/savedItemModel');

// Add to saved items
const addSavedItem = async (req, res) => {
  try {
    const { type, targetId } = req.body;
    if (!['product', 'user'].includes(type)) {
      return res.status(400).json({ message: 'Invalid type' });
    }
    const targetModel = type === 'product' ? 'Product' : 'User';
    const saved = await SavedItem.findOne({ user: req.user.id, type, target: targetId });
    if (saved) return res.status(200).json({ message: 'Already saved', saved });
    const created = await SavedItem.create({ user: req.user.id, type, target: targetId, targetModel });
    res.status(201).json({ message: 'Saved item added', saved: created });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get saved items (optionally filter by type)
const getSavedItems = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = { user: req.user.id };
    if (type) filter.type = type;
    const items = await SavedItem.find(filter)
      .populate({ path: 'target', select: type === 'user' ? 'name location role avatarPath' : 'name category location intent images', strictPopulate: false });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Remove saved item
const deleteSavedItem = async (req, res) => {
  try {
    const item = await SavedItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Saved item not found' });
    if (String(item.user) !== String(req.user.id)) {
      return res.status(403).json({ message: 'You do not own this saved item' });
    }
    await SavedItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Saved item removed' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = { addSavedItem, getSavedItems, deleteSavedItem };