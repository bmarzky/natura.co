const { Groq } = require('groq-sdk');
const { SYSTEM_PROMPT } = require('../config/prompt');
const { chargeTransaction, getTransactionStatus } = require('./midtransService');
const { getVillages } = require('./locationService');
const { reverseGeocode } = require('./geocodingService');
const { logChatMessage, upsertOrder, loadHistory, loadOrder } = require('./supabaseService');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const chatHistories = {};
const latestStates = {}; // Store latest state per phone for easier access

async function processMessage(phone, text) {
  // Buat sesi baru jika belum ada (ANTI-AMNESIA: Tarik dari Supabase jika ada)
  if (!chatHistories[phone]) {
    const pastHistory = await loadHistory(phone);
    const pastOrder = await loadOrder(phone);
    
    chatHistories[phone] = pastHistory.length > 0 ? pastHistory : [];
    latestStates[phone] = Object.keys(pastOrder).length > 0 ? pastOrder : {};
  }

  // Jika AI sedang dibungkam (Human Handoff), jangan proses pesan dengan AI
  if (latestStates[phone] && latestStates[phone].is_paused) {
      console.log(`[Human Handoff] Pesan dari ${phone} diabaikan oleh AI karena sedang ditangani Admin.`);
      // Dalam WhatsApp sungguhan, kita diam saja. Di Playground kita kirim feedback:
      return { reply: ["(Sedang menghubungkan ke Admin...)"], state: latestStates[phone] };
  }

  // Cek apakah pesan mengandung titik koordinat (simulasi ShareLoc)
  // Contoh regex untuk "5.2079, 96.7029" atau URL maps yang mengandung koordinat
  let processedText = text;
  const coordRegex = /(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/;
  const match = text.match(coordRegex);
  
  if (match) {
      const lat = match[1];
      const lon = match[2];
      const geoResult = await reverseGeocode(lat, lon);
      if (geoResult) {
          processedText += `\n[SISTEM: Pelanggan mengirim titik kordinat peta. Terjemahan alamat dari GPS: Desa ${geoResult.village}, ${geoResult.district}. Alamat lengkap: ${geoResult.full_address}]`;
      }
  }

  // Tambahkan pesan user ke histori dan log ke Supabase
  chatHistories[phone].push({ role: 'user', content: processedText });
  await logChatMessage(phone, 'user', processedText);

  try {
    let currentState = latestStates[phone];
    let paymentInfo = '';
    let isCheckingPayment = false;
    
    // Check payment status if waiting for payment
    if (currentState && currentState.order_status === 'awaiting_payment' && currentState.order_id) {
        isCheckingPayment = true;
        let lastStatus = 'not_found';
        let paymentFound = false;
        
        // Lakukan polling: cek Midtrans hingga 5 kali dengan jeda 5 detik (total 25 detik)
        for (let i = 0; i < 5; i++) {
            try {
                const status = await getTransactionStatus(currentState.order_id);
                if (status.transaction_status) {
                    lastStatus = status.transaction_status;
                    if (lastStatus !== 'not_found' && lastStatus !== 'pending') {
                        currentState.payment_status = lastStatus;
                        paymentFound = true;
                        break;
                    }
                }
            } catch (e) {
                console.error('Midtrans status check error:', e.message);
            }
            if (!paymentFound) {
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }

        if (!paymentFound) {
            currentState.payment_status = lastStatus;
            paymentInfo = `\nStatus Pembayaran Midtrans saat ini: '${lastStatus}' (Pembayaran belum sukses). Beritahu pelanggan dengan santai bahwa sistem belum menerima dana mereka, dan mintalah mereka mengecek ulang apakah transfernya sudah berhasil.`;
        } else {
            paymentInfo = `\nStatus Pembayaran Midtrans saat ini: '${currentState.payment_status}'. (Jika 'settlement' atau 'capture' artinya sudah dibayar LUNAS, berikan konfirmasi sukses!).`;
        }
    }

    const currentDate = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const validVillages = getVillages().join(', ');
    const dynamicSystemPrompt = SYSTEM_PROMPT + `\n\nINFO SISTEM (PENTING):\nTanggal Hari Ini adalah: ${currentDate}. Gunakan tanggal ini sebagai acuan SATU-SATUNYA untuk menghitung waktu relatif secara akurat (misal "besok", "jumat depan", dll).${paymentInfo}\nDAFTAR DESA/KELURAHAN SAH KOTA JUANG: ${validVillages}. (Gunakan daftar ini untuk memvalidasi alamat yang diberikan pelanggan).`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: dynamicSystemPrompt },
        ...chatHistories[phone]
      ],
      model: 'openai/gpt-oss-120b', 
      response_format: { type: 'json_object' },
      temperature: 0.5,
    });

    const botResponse = completion.choices[0].message.content;
    const data = JSON.parse(botResponse);

    // Inject Midtrans if needed
    if (data.state && data.state.order_status === 'awaiting_payment' && !data.state.payment_link) {
        const orderId = `ORDER-${Date.now()}`;
        const qty = data.state.quantity ? parseInt(data.state.quantity) : 1;
        const amount = 250000 * qty; 
        const customerDetails = {
            first_name: data.state.customer_name || 'Customer',
            phone: phone
        };
        const method = data.state.payment_method || 'bca';
        
        try {
            const chargeResponse = await chargeTransaction(orderId, amount, customerDetails, method);
            
            data.state.order_id = orderId;
            data.state.payment_status = 'pending';
            data.state.payment_link = 'generated_via_core_api'; // just to mark it as generated
            
            let paymentInstruction = '';
            
            if (chargeResponse.payment_type === 'bank_transfer' && chargeResponse.va_numbers && chargeResponse.va_numbers.length > 0) {
                const vaInfo = chargeResponse.va_numbers[0];
                paymentInstruction = `Silakan transfer ke Virtual Account ${vaInfo.bank.toUpperCase()} berikut:\n\n*${vaInfo.va_number}*\nAtas Nama: Natura House\nNominal: Rp${amount.toLocaleString('id-ID')}\n\nKabari kami kalau sudah transfer ya kak!`;
            } else if (chargeResponse.payment_type === 'echannel' && chargeResponse.biller_code) {
                paymentInstruction = `Silakan transfer via Mandiri Bill Payment:\n\nCompany Code: *${chargeResponse.biller_code}*\nBill Key: *${chargeResponse.bill_key}*\nNominal: Rp${amount.toLocaleString('id-ID')}\n\nKabari kami kalau sudah transfer ya kak!`;
            } else if (chargeResponse.payment_type === 'qris' || chargeResponse.payment_type === 'gopay') {
                const qrUrl = chargeResponse.actions && chargeResponse.actions.find(a => a.name === 'generate-qr-code' || a.name === 'generate-qr-code');
                if (qrUrl) {
                     paymentInstruction = `Silakan scan QR code pada link berikut atau buka URL ini untuk membayar via ${method.toUpperCase()}:\n${qrUrl.url}\n\nKabari kami kalau sudah bayar ya kak!`;
                } else {
                     paymentInstruction = `Pesanan ${method.toUpperCase()} berhasil dibuat. Silakan selesaikan pembayaran di aplikasi Anda.\n\nKabari kami kalau sudah bayar ya kak!`;
                }
            } else {
                paymentInstruction = `Instruksi pembayaran untuk ${method.toUpperCase()} telah disiapkan. Silakan cek aplikasi/email Anda untuk detail lebih lanjut.\n\nKabari kami kalau sudah bayar ya kak!`;
            }
            
            data.reply.push(paymentInstruction);
        } catch (err) {
            data.reply.push("Maaf kak, ada sedikit gangguan saat membuat instruksi pembayaran. Mohon tunggu sebentar ya.");
        }
    }

    // Update latest state
    if (data.state) {
        latestStates[phone] = data.state;
    }

    // CEK HUMAN HANDOFF (Kirim Notif ke Admin dan Bungkam AI)
    if (data.intent === 'human_handoff') {
        console.log(`\n\n🚨 [NOTIFIKASI WHATSAPP KE ADMIN] 🚨`);
        console.log(`Tujuan: Nomor WhatsApp Bos/Admin`);
        console.log(`Pesan: "Bos, ada pelanggan yang butuh bantuan manusia di nomor ${phone}. AI sudah dibungkam, silakan balas manual!"\n\n`);
        
        latestStates[phone].is_paused = true;
        data.state.is_paused = true;
        
        const summary = data.complaint_summary || "Pelanggan meminta bantuan manual.";
        const orderIdText = data.state.order_id ? `\nID: ${data.state.order_id}` : "";

        // Mengeksekusi pengiriman WA sungguhan ke HP Admin jika token tersedia di .env
        if (process.env.WA_ACCESS_TOKEN && process.env.WA_PHONE_ID && process.env.ADMIN_PHONE) {
            fetch(`https://graph.facebook.com/v20.0/${process.env.WA_PHONE_ID}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.WA_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: process.env.ADMIN_PHONE,
                    type: 'text',
                    text: { body: `Ada komplain masuk dari:\nNo: ${phone}${orderIdText}\nMasalah: ${summary}` }
                })
            }).then(async (res) => {
                const responseJson = await res.json();
                console.log("[META API RESPONSE]:", JSON.stringify(responseJson, null, 2));
            }).catch(e => console.error("[Human Handoff] Gagal mengirim notif WA ke admin:", e.message));
        }
    }

    // Jika bot tadi melakukan polling pengecekan pembayaran, tambahkan pesan bahwa dia sudah mengecek
    if (isCheckingPayment) {
        data.reply.unshift("Baik kak, sebentar kami cek dulu ya di sistem...");
    }

    // Tambahkan balasan bot ke histori (simpan versi yang sudah diupdate dengan link)
    chatHistories[phone].push({ role: 'assistant', content: JSON.stringify(data) });

    // Log semua balasan AI ke Supabase
    if (Array.isArray(data.reply)) {
        for (const msg of data.reply) {
            await logChatMessage(phone, 'assistant', msg);
        }
    } else {
        await logChatMessage(phone, 'assistant', data.reply);
    }
    
    // Simpan order state yang paling baru ke Supabase jika order_id sudah terbuat
    if (data.state && data.state.order_id) {
        await upsertOrder(data.state);
    }

    return data;
  } catch (err) {
    console.error('Groq API Error:', err);
    return {
      reply: ["Mohon maaf, layanan pelanggan kami sedang mengalami gangguan sementara."],
      state: { error: true }
    };
  }
}

async function handleWebhookNotification(orderId, transactionStatus) {
    let targetPhone = null;
    for (const [phone, state] of Object.entries(latestStates)) {
        if (state.order_id === orderId) {
            targetPhone = phone;
            break;
        }
    }

    if (!targetPhone) {
        console.log(`[Webhook] Order ${orderId} not found in active states.`);
        return false;
    }

    const state = latestStates[targetPhone];
    
    // Hanya proses jika status benar-benar sukses dan belum ditandai paid
    if ((transactionStatus === 'settlement' || transactionStatus === 'capture') && state.payment_status !== 'settlement' && state.payment_status !== 'capture') {
        console.log(`[Webhook] Payment success detected for ${orderId}. Waking up AI...`);
        state.payment_status = transactionStatus;
        
        // Panggil AI secara internal dengan prompt sistem agar dia berterima kasih secara proaktif
        const systemMsg = `[SISTEM WEBHOOK OTOMATIS: Pembayaran untuk pesanan dengan Order ID ${orderId} baru saja BERHASIL diverifikasi (masuk lunas). Tolong sampaikan rasa terima kasih yang hangat kepada pelanggan sekarang juga tanpa menunggu mereka membalas. SEBUTKAN ULANG secara spesifik tanggal, jam pengiriman, dan alamat yang sudah disepakati (baca dari state). Ucapkan terima kasih karena telah mempercayakan pesanannya kepada Natura House! Khusus untuk pesan ini boleh tambahkan 1 emoji senyum.]`;
        
        // Panggil processMessage untuk menghasilkan balasan AI
        await processMessage(targetPhone, systemMsg);
        
        // Catatan: Dalam integrasi WA asli, setelah processMessage selesai, 
        // kita akan melakukan client.sendMessage(targetPhone, hasilAI.reply[0]) ke WhatsApp mereka.
    }
    
    return true;
}

module.exports = { processMessage, handleWebhookNotification };
