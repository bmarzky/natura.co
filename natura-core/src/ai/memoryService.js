const { loadHistory, logChatMessage } = require('../repositories/supabaseClient');

// Cache RAM sementara agar tidak membebani Supabase setiap detik
const chatHistories = {};

/**
 * Mengambil memori chat (Gabungan RAM & Supabase)
 */
async function getChatHistory(phone) {
    if (!chatHistories[phone]) {
        const pastHistory = await loadHistory(phone);
        chatHistories[phone] = pastHistory.length > 0 ? pastHistory : [];
    }
    return chatHistories[phone];
}

/**
 * Menyimpan pesan ke Memori dan Database
 */
async function addMessageToMemory(phone, role, content) {
    if (!chatHistories[phone]) {
        chatHistories[phone] = [];
    }
    chatHistories[phone].push({ role, content });
    
    // Simpan ke Supabase untuk sinkronisasi antar-worker
    await logChatMessage(phone, role, content);
}

module.exports = {
    getChatHistory,
    addMessageToMemory
};
