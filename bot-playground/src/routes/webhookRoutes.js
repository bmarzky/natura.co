const express = require('express');
const router = express.Router();
const { handleWebhookNotification } = require('../services/aiService');

router.post('/midtrans', async (req, res) => {
    try {
        const notification = req.body;
        console.log('[Webhook] Received notification:', notification.order_id, notification.transaction_status);

        // Idealnya, di sini kita harus memverifikasi signature_key Midtrans
        // const signatureKey = crypto.createHash('sha512').update(notification.order_id + notification.status_code + notification.gross_amount + process.env.MIDTRANS_SERVER_KEY).digest('hex');
        // if (signatureKey !== notification.signature_key) return res.status(403).json({ error: "Invalid signature" });

        const orderId = notification.order_id;
        const transactionStatus = notification.transaction_status;

        // Oper ke AI Service agar state terupdate dan AI "terbangun" untuk berterima kasih
        await handleWebhookNotification(orderId, transactionStatus);

        // Selalu balas 200 OK ke Midtrans agar mereka tidak mengirim notifikasi berulang kali
        res.status(200).json({ status: 'ok' });
    } catch (error) {
        console.error('[Webhook] Error handling notification:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// META WHATSAPP CLOUD API WEBHOOK (RESMI)
// ============================================

// 1. Verifikasi Webhook dari Dashboard Meta
router.get('/meta', (req, res) => {
    // Token rahasia buatan kita sendiri untuk mengamankan webhook
    const VERIFY_TOKEN = process.env.WA_VERIFY_TOKEN || "NATURA_RAHASIA_123";

    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('[Meta Webhook] Berhasil diverifikasi oleh Facebook!');
            return res.status(200).send(challenge);
        } else {
            return res.status(403).send('Gagal verifikasi token');
        }
    }
    res.status(400).send('Format permintaan salah');
});

// 2. Menerima Pesan Masuk dari WhatsApp
const aiService = require('../services/aiService');

router.post('/meta', async (req, res) => {
    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
        if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages && body.entry[0].changes[0].value.messages[0]) {
            const message = body.entry[0].changes[0].value.messages[0];
            const phone = message.from; // Nomor pengirim
            let text = "";

            if (message.type === 'text') {
                text = message.text.body;
            } else if (message.type === 'image') {
                text = "[Mengirim Gambar/Foto]";
            }

            console.log(`[WhatsApp API Masuk] Dari: ${phone} | Pesan: ${text}`);

            if (text) {
                // Jangan ditunggu (await) agar server segera membalas 200 OK ke Meta (Syarat Meta)
                aiService.processChatMeta(phone, text).catch(e => console.log('Gagal balas meta:', e));
            }
        }
        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

module.exports = router;
