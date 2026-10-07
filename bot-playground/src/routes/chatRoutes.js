const express = require('express');
const { processMessage } = require('../services/aiService');

const router = express.Router();

router.post('/', async (req, res) => {
  const { phone, text } = req.body;
  const result = await processMessage(phone || 'default_user', text);
  res.json(result);
});

module.exports = router;
