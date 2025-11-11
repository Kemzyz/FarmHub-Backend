const Conversation = require('../models/conversationModel');
const Message = require('../models/messageModel');
const Order = require('../models/orderModel');

function snippet(text, len = 140) {
  if (!text) return '';
  return text.length > len ? text.slice(0, len) + '…' : text;
}

// Start or get a conversation between current user and recipient, optionally tied to an order
exports.startConversation = async (req, res) => {
  try {
    const me = req.user;
    const { recipientId, orderId } = req.body;
    let participants;

    if (orderId) {
      const order = await Order.findById(orderId);
      if (!order) return res.status(404).json({ message: 'Order not found' });
      // Ensure current user is buyer or farmer on the order
      const isParty = [String(order.buyer), String(order.farmer)].includes(String(me._id));
      if (!isParty) return res.status(403).json({ message: 'Not authorized for this order conversation' });
      participants = [order.buyer, order.farmer];
      // Try to find existing conversation for this order
      let convo = await Conversation.findOne({ order: orderId, participants: { $all: participants } });
      if (!convo) {
        convo = await Conversation.create({ participants, order: orderId });
      }
      return res.status(201).json(convo);
    }

    if (!recipientId) return res.status(400).json({ message: 'recipientId or orderId required' });
    participants = [me._id, recipientId];
    let convo = await Conversation.findOne({ order: { $exists: false }, participants: { $all: participants } });
    if (!convo) {
      convo = await Conversation.create({ participants });
    }
    res.status(201).json(convo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to start conversation' });
  }
};

// List conversations for current user
exports.listConversations = async (req, res) => {
  try {
    const me = req.user;
    const convos = await Conversation.find({ participants: me._id })
      .sort({ updatedAt: -1 })
      .populate('participants', 'name email avatarPath role')
      .populate({ path: 'order', select: 'status subtotal' });
    res.json(convos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to list conversations' });
  }
};

// Get messages in a conversation (ensure participant)
exports.getMessages = async (req, res) => {
  try {
    const me = req.user;
    const { id } = req.params;
    const convo = await Conversation.findById(id);
    if (!convo) return res.status(404).json({ message: 'Conversation not found' });
    if (!convo.participants.map(String).includes(String(me._id))) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const messages = await Message.find({ conversation: id }).sort({ createdAt: 1 }).populate('sender', 'name');
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
};

// Send a message in a conversation
exports.sendMessage = async (req, res) => {
  try {
    const me = req.user;
    const { id } = req.params;
    const { body } = req.body;
    if (!body || !String(body).trim()) return res.status(400).json({ message: 'Message body required' });
    const convo = await Conversation.findById(id);
    if (!convo) return res.status(404).json({ message: 'Conversation not found' });
    if (!convo.participants.map(String).includes(String(me._id))) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const msg = await Message.create({ conversation: id, sender: me._id, body, readBy: [me._id] });
    convo.lastMessageAt = new Date();
    convo.lastMessageSnippet = snippet(body);
    await convo.save();
    const populated = await Message.findById(msg._id).populate('sender', 'name');
    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

// Mark messages in a conversation as read
exports.markRead = async (req, res) => {
  try {
    const me = req.user;
    const { id } = req.params;
    const convo = await Conversation.findById(id);
    if (!convo) return res.status(404).json({ message: 'Conversation not found' });
    if (!convo.participants.map(String).includes(String(me._id))) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const result = await Message.updateMany(
      { conversation: id, readBy: { $ne: me._id } },
      { $addToSet: { readBy: me._id } }
    );
    res.json({ updated: result.modifiedCount || result.nModified || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to mark as read' });
  }
};