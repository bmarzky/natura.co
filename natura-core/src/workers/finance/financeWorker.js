const { generateResponse } = require('../../ai/modelGateway');
const { getChatHistory, addMessageToMemory } = require('../../ai/memoryService');
const { FINANCE_PROMPT } = require('../../config/prompts/financePrompt');
const { getTransactionStatus, chargeTransaction } = require('../../integrations/midtrans/midtransService');

async function handlePaymentChat(phone, text, state) {
    // 1. Coba check pembayaran ke Midtrans terlebih dahulu
    let paymentInfo = '';
    if (state.order_id) {
        try {
            let checkId = state.midtrans_order_id || state.order_id;
            
            // Extract from payment_info if available (karena midtrans_order_id hilang saat disimpan ke DB)
            if (state.payment_info && state.payment_info.includes('MIDTRANS_ID:')) {
                const match = state.payment_info.match(/MIDTRANS_ID:([^\s]+)/);
                if (match && match[1]) {
                    checkId = match[1];
                }
            }
            
            const status = await getTransactionStatus(checkId);
            if (status.transaction_status) {
                state.payment_status = status.transaction_status;
            }

            // Cek sudah dibayar atau belum
            if (state.payment_status === 'pending' && (text.toLowerCase().includes('sudah') || text.toLowerCase().includes('bayar'))) {
                console.log(`[FinanceWorker] Pelanggan ${phone} klaim sudah bayar, mengubah status ke pending_claimed untuk divalidasi Cron Job.`);
                state.payment_status = 'pending_claimed';
            }
        } catch (e) {
            console.log('[FinanceWorker] Error checking midtrans:', e.message);
        }
    }
    
    // 2. Tambahkan info status untuk Prompt
    if (state.payment_info) {
        paymentInfo = `INFO SISTEM: Status pembayaran di server adalah '${state.payment_status}'. Nomor rekening/VA/Link yang telah digenerate sebelumnya adalah: ${state.payment_info}`;
    } else {
        paymentInfo = `INFO SISTEM: Status pembayaran di server adalah '${state.payment_status}'.`;
    }

    // 3. Tambah pesan user ke memori (Fire and forget)
    addMessageToMemory(phone, 'user', text).catch(e => console.log('Error memori:', e));
    const history = await getChatHistory(phone);
    history.push({ role: 'user', content: text });
    
    // 4. Inject prompt
    const dynamicPrompt = FINANCE_PROMPT + `\n\n[STATE SAAT INI]\n${JSON.stringify(state, null, 2)}\n\n${paymentInfo}`;
    
    // 5. Panggil LLM
    const aiOutput = await generateResponse(dynamicPrompt, history);
    
    // 6. Simpan pesan AI ke memori (Fire and forget)
    if (aiOutput.reply && aiOutput.reply.length > 0) {
        addMessageToMemory(phone, 'assistant', aiOutput.reply.join(' ')).catch(e => console.log('Error memori:', e));
    }

    return {
        reply: aiOutput.reply || [],
        state: { ...state, ...(aiOutput.state || {}) },
        intent: aiOutput.intent || 'finance_chat'
    };
}

module.exports = { handlePaymentChat };
