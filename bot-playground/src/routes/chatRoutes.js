const express = require('express');
const { processMessage, unpauseBot, getBotStatus } = require('../services/aiService');

const router = express.Router();

router.post('/', async (req, res) => {
  const { phone, text } = req.body;
  const result = await processMessage(phone || 'default_user', text);
  res.json(result);
});

router.post('/unpause', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: "Phone number required" });
  const result = await unpauseBot(phone);
  res.json(result);
});

router.get('/status/:phone', async (req, res) => {
  const result = await getBotStatus(req.params.phone);
  console.log(`[API] Admin Dashboard merequest status untuk ${req.params.phone}. Hasil is_paused:`, result.is_paused);
  res.json(result);
});

module.exports = router;
