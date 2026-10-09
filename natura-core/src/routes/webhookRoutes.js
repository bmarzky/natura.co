const express = require('express');
const router = express.Router();
const businessManager = require('../orchestrator/businessManager');

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
        await businessManager.handleWebhookNotification(orderId, transactionStatus);

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
// aiService dipindah ke businessManager

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
                businessManager.processChatMeta(phone, text).catch(e => console.log('Gagal balas meta:', e));
            }
        }
        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

// ==========================================
// 3. ENDPOINT CRON JOB (Diakses oleh cPanel Cron)
// GET /api/webhook/cron/check-pending
// ==========================================
router.get('/cron/check-pending', async (req, res) => {
    try {
        const { getPendingOrders, updatePaymentStatusByOrderId } = require('../repositories/supabaseClient');
        const { getTransactionStatus } = require('../integrations/midtrans/midtransService');
        
        const pendingOrders = await getPendingOrders();
        let checkedCount = 0;
        let warnedCount = 0;

        for (const order of pendingOrders) {
            // Cek usia order (Hanya yang usianya di atas 5 menit dan di bawah 2 jam yang kita tegur)
            const orderTime = new Date(order.created_at).getTime();
            const now = Date.now();
            const diffMinutes = (now - orderTime) / (1000 * 60);

            if (diffMinutes >= 5 && diffMinutes <= 120) {
                checkedCount++;
                let checkId = order.midtrans_order_id || order.order_id;
                const status = await getTransactionStatus(checkId);

                if (status && (status.transaction_status === 'pending' || status.transaction_status === 'not_found')) {
                    // Update status di DB agar tidak di-warn berulang-ulang setiap 5 menit
                    await updatePaymentStatusByOrderId(order.order_id, 'pending_warned');
                    warnedCount++;
                    
                    // Kirim notifikasi teguran ke WhatsApp pelanggan
                    await businessManager.sendMetaWhatsAppMessage(
                        order.phone, 
                        `Maaf kak, pembayaran untuk pesanan *${order.product}* sudah kami cek berkala, namun sepertinya belum masuk ke mutasi kami. Mohon pastikan transfer sudah berhasil, atau kakak bisa melampirkan bukti transfer/struknya di sini agar kami bantu cek manual ya 🙏`
                    );
                } else if (status && (status.transaction_status === 'settlement' || status.transaction_status === 'capture')) {
                    // Berjaga-jaga jika webhook Midtrans gagal, cron job ini akan mensukseskannya!
                    await businessManager.handleWebhookNotification(checkId, status.transaction_status);
                }
            }
        }

        res.status(200).json({ success: true, checked: checkedCount, warned: warnedCount, total_pending: pendingOrders.length });
    } catch (e) {
        console.error('[Cron] Error checking pending orders:', e);
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
