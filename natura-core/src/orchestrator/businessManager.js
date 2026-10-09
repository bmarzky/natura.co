const { handleSalesChat } = require('../workers/sales/salesWorker');
const { handlePaymentChat } = require('../workers/finance/financeWorker');
const { loadOrder, upsertOrder, loadHistory } = require('../repositories/supabaseClient');
const axios = require('axios');

// Fungsi untuk menembak Meta WhatsApp API langsung (Diambil dari aiService.js lama)
async function sendMetaWhatsAppMessage(phone, text) {
    const token = process.env.WA_ACCESS_TOKEN;
    const phoneId = process.env.WA_PHONE_ID;
    if (!token || !phoneId) return;

    try {
        await axios.post(
            `https://graph.facebook.com/v17.0/${phoneId}/messages`,
            { messaging_product: 'whatsapp', to: phone, text: { body: text } },
            { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
        );
    } catch (e) {
        console.error('[Meta API] Gagal kirim WA:', e.message);
    }
}

/**
 * Pintu masuk utama untuk semua chat. Manajer akan menyeleksi siapa yang bekerja.
 */
async function processMessage(phone, text) {
    let pastOrder = await loadOrder(phone);

    // REPEAT ORDER LOGIC
    if (pastOrder && (pastOrder.payment_status === 'settlement' || pastOrder.payment_status === 'capture')) {
        pastOrder = {}; 
    }

    const state = Object.keys(pastOrder).length > 0 ? pastOrder : {};

    // DRAFTING LOGIC
    if (!state.order_id) {
        state.order_id = `ORDER-${Date.now()}`;
        state.payment_status = 'draft';
        state.order_status = 'draft';
    }

    // Jika sedang di-pause oleh Admin, Bot jangan membalas
    if (state.is_paused) {
        console.log(`[BusinessManager] Chat dari ${phone} diabaikan karena is_paused = true (Ditangani Admin).`);
        return { reply: [], state, intent: 'paused' };
    }

    // ORCHESTRATION / ROUTING
    let workerResult;
    if (state.order_status === 'awaiting_payment') {
        console.log(`[BusinessManager] Routing chat ke Divisi Finance...`);
        workerResult = await handlePaymentChat(phone, text, state);
    } else {
        console.log(`[BusinessManager] Routing chat ke Divisi Sales...`);
        workerResult = await handleSalesChat(phone, text, state);
        
        // INTERCEPT TRANSAKSI: Jika Sales baru saja mengubah status jadi awaiting_payment
        if (state.order_status !== 'awaiting_payment' && workerResult.state.order_status === 'awaiting_payment') {
            try {
                const { createCoreTransaction, createSnapTransaction } = require('../integrations/midtrans/midtransService');
                const amount = (workerResult.state.quantity || 1) * 250000;
                
                const customerDetails = {
                    first_name: "Customer",
                    phone: phone,
                    shipping_address: {
                        address: workerResult.state.delivery_address || "Toko",
                        city: "Bireuen"
                    }
                };

                const chosenMethod = workerResult.state.payment_method || '';
                
                if (chosenMethod) {
                    // Cetak VA / Link Spesifik langsung
                    const trx = await createCoreTransaction(workerResult.state.order_id, amount, customerDetails, chosenMethod);
                    let paymentInstruction = "";
                    
                    if (trx.payment_type === 'bank_transfer' && trx.va_numbers && trx.va_numbers.length > 0) {
                        const bank = trx.va_numbers[0].bank.toUpperCase();
                        const vaNum = trx.va_numbers[0].va_number;
                        paymentInstruction = `Kode Virtual Account ${bank} kakak adalah:\n*${vaNum}*\n\nSilakan transfer sebesar Rp${amount.toLocaleString('id-ID')} ke nomor VA tersebut.`;
                        workerResult.state.payment_info = `VA ${bank}: ${vaNum}`;
                    } else if (trx.payment_type === 'echannel') {
                        paymentInstruction = `Kode Biller Mandiri: *${trx.biller_code}*\nKode Bayar: *${trx.bill_key}*\n\nSilakan transfer sebesar Rp${amount.toLocaleString('id-ID')}.`;
                        workerResult.state.payment_info = `Mandiri Biller: ${trx.biller_code}, Bill Key: ${trx.bill_key}`;
                    } else if (trx.payment_type === 'gopay' && trx.actions) {
                        const gopayUrl = trx.actions.find(a => a.name === 'generate-qr-code' || a.name === 'deeplink')?.url;
                        paymentInstruction = `Silakan klik tautan GoPay berikut untuk menyelesaikan pembayaran:\n🔗 ${gopayUrl || 'https://gopay.co.id'}`;
                        workerResult.state.payment_info = `Link GoPay: ${gopayUrl}`;
                    } else if (trx.payment_type === 'qris' && trx.actions) {
                        const qrisUrl = trx.actions[0]?.url;
                        paymentInstruction = `Silakan klik tautan QRIS berikut untuk menyelesaikan pembayaran:\n🔗 ${qrisUrl}`;
                        workerResult.state.payment_info = `Link QRIS: ${qrisUrl}`;
                    } else {
                        // Jika gagal parsing, kembalikan ke Snap
                        const snapUrl = await createSnapTransaction(workerResult.state.order_id, amount, customerDetails);
                        paymentInstruction = `Silakan klik tautan berikut untuk menyelesaikan tagihan Anda kak:\n🔗 ${snapUrl}`;
                        workerResult.state.payment_info = `Midtrans Link: ${snapUrl}`;
                    }
                    
                    workerResult.reply.push(paymentInstruction);
                } else {
                    // Fallback jika tidak ada metode yang dipilih (pilih sendiri via Snap)
                    const paymentUrl = await createSnapTransaction(workerResult.state.order_id, amount, customerDetails);
                    workerResult.reply.push(`Silakan klik tautan berikut untuk mendapatkan kode pembayaran / Virtual Account kakak:\n\n🔗 ${paymentUrl}`);
                    workerResult.state.payment_info = `Midtrans Link: ${paymentUrl}`;
                }
                
            } catch (err) {
                console.error("Gagal membuat Transaksi Midtrans:", err);
                workerResult.reply.push("Maaf kak, sistem pembayaran kami sedang memproses tagihan Anda. Mohon tunggu sebentar ya.");
            }
        }
    }

    // UPDATE DATABASE (Fire and Forget)
    upsertOrder(phone, workerResult.state).catch(e => console.log('Error upsert:', e));

    // CEK HUMAN HANDOFF
    if (workerResult.intent === 'human_handoff') {
        workerResult.state.is_paused = true;
        await upsertOrder(phone, workerResult.state);
        // Notif Admin (Idealnya pakai utilitas notifikasi, disederhanakan dulu)
        console.log(`[BusinessManager] HUMAN HANDOFF TRIGGERED untuk ${phone}`);
    }

    return workerResult;
}

// Fungsi pembantu untuk admin panel
async function getBotStatus(phone) {
    const order = await loadOrder(phone);
    return order ? (order.is_paused ? 'paused' : 'active') : 'active';
}

async function unpauseBot(phone) {
    const order = await loadOrder(phone);
    if (order) {
        order.is_paused = false;
        await upsertOrder(phone, order);
    }
}

// Handler khusus untuk Webhook Meta (Menerima Event dari luar)
async function processChatMeta(phone, text) {
    try {
        const result = await processMessage(phone, text);
        const replies = result.reply || [];

        for (const replyText of replies) {
            await sendMetaWhatsAppMessage(phone, replyText);
            // Jeda 500ms agar pesan berurutan
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (result.intent === 'human_handoff') {
            await sendMetaWhatsAppMessage(phone, "Tunggu sebentar ya kak, admin kami akan segera merespons pesan kakak 🙏");
            const adminPhone = process.env.ADMIN_PHONE;
            if (adminPhone) {
                await sendMetaWhatsAppMessage(adminPhone, `🚨 HUMAN HANDOFF 🚨\nPelanggan dengan nomor *${phone}* butuh bantuan manual segera. AI telah dibungkam sementara.`);
            }
        }
    } catch (e) {
        console.error('[BusinessManager] Error memproses webhook meta:', e);
    }
}

async function handleWebhookNotification(orderId, transactionStatus) {
    // Karena sekarang tidak ada global state terbaru dalam RAM, kita harus mencari 
    // pesanan di database berdasarkan order_id.
    // Idealnya ada fungsi loadOrderByOrderId di supabaseClient, tapi sementara kita
    // abaikan jika sulit mencari, atau cukup update langsung ke database.
    // Untuk saat ini, fungsi ini hanya log untuk menghindari crash.
    console.log(`[BusinessManager] Payment webhook received for ${orderId} status: ${transactionStatus}`);
}

module.exports = {
    processMessage,
    processChatMeta,
    getBotStatus,
    unpauseBot,
    sendMetaWhatsAppMessage,
    handleWebhookNotification
};
