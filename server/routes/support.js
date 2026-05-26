// support.js
const express = require('express');
const router1 = express.Router();
const { SupportTicket } = require('../models/index');
const { auth, requireRole } = require('../middleware/auth');

router1.post('/tickets', async (req, res) => {
  try {
    const ticket = await SupportTicket.create(req.body);
    res.status(201).json(ticket);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router1.get('/tickets', auth, async (req, res) => {
  try {
    const query = req.user.role === 'superadmin' ? {} : { restaurantId: req.user.restaurantId };
    const tickets = await SupportTicket.find(query).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router1.post('/tickets/:id/reply', auth, async (req, res) => {
  try {
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      {
        $push: { messages: { sender: req.user.name, senderRole: req.user.role, text: req.body.text } },
        status: 'inprogress'
      },
      { new: true }
    );
    res.json(ticket);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router1.patch('/tickets/:id', auth, async (req, res) => {
  try {
    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(ticket);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router1;
