const express = require('express');
const { processMessage, unpauseBot, pauseBot, getBotStatus, sendMetaWhatsAppMessage } = require('../orchestrator/businessManager');
const { markChatAsRead, loadOrder } = require('../repositories/supabaseClient');

const router = express.Router();

router.post('/', async (req, res) => {
  const { phone, text } = req.body;
  const result = await processMessage(phone || 'default_user', text);
  res.json(result);
});

router.post('/unpause', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: "Phone number required" });
  try {
    await unpauseBot(phone);
    const order = await loadOrder(phone);
    if (order && order.is_paused === true) return res.status(500).json({ error: 'Verifikasi gagal: is_paused masih true setelah unpause' });
    res.json({ success: true });
  } catch (err) {
    console.error('[Route] Unpause error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/pause', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: "Phone number required" });
  try {
    await pauseBot(phone);
    const order = await loadOrder(phone);
    if (!order || order.is_paused !== true) return res.status(500).json({ error: 'Verifikasi gagal: is_paused tidak berubah jadi true. Order: ' + JSON.stringify(order) });
    res.json({ success: true });
  } catch (err) {
    console.error('[Route] Pause error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/status/:phone', async (req, res) => {
  const result = await getBotStatus(req.params.phone);
  console.log(`[API] Admin Dashboard merequest status untuk ${req.params.phone}. Hasil is_paused:`, result.is_paused);
  res.json(result);
});

router.post('/mark-read/:phone', async (req, res) => {
  await markChatAsRead(req.params.phone);
  res.json({ success: true });
});

router.post('/send-admin', async (req, res) => {
  const { phone, text } = req.body;
  if (!phone || !text) return res.status(400).json({ error: "Phone and text required" });
  await sendMetaWhatsAppMessage(phone, text);
  res.json({ success: true });
});

module.exports = router;
