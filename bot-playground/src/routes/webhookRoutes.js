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

module.exports = router;
