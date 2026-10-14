const { loadHistory, logChatMessage } = require('../repositories/supabaseClient');

// Cache RAM sementara agar tidak membebani Supabase setiap detik
const chatHistories = {};
const cacheTimestamps = {};

const MAX_CACHE_SIZE = 500;  // Maksimal 500 user di RAM sekaligus
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 jam — hapus cache user yang tidak aktif

/**
 * Bersihkan cache yang sudah kadaluarsa atau jika terlalu banyak
 */
function evictStaleCache() {
    const now = Date.now();
    const phones = Object.keys(chatHistories);

    // Hapus yang sudah kadaluarsa
    for (const phone of phones) {
        if (now - (cacheTimestamps[phone] || 0) > CACHE_TTL_MS) {
            delete chatHistories[phone];
            delete cacheTimestamps[phone];
        }
    }

    // Jika masih terlalu banyak, hapus yang paling lama tidak aktif
    const remaining = Object.keys(chatHistories);
    if (remaining.length > MAX_CACHE_SIZE) {
        const sorted = remaining.sort((a, b) => (cacheTimestamps[a] || 0) - (cacheTimestamps[b] || 0));
        const toDelete = sorted.slice(0, remaining.length - MAX_CACHE_SIZE);
        for (const phone of toDelete) {
            delete chatHistories[phone];
            delete cacheTimestamps[phone];
        }
    }
}

/**
 * Mengambil memori chat (Gabungan RAM & Supabase)
 */
async function getChatHistory(phone) {
    if (!chatHistories[phone]) {
        const pastHistory = await loadHistory(phone);
        chatHistories[phone] = pastHistory.length > 0 ? pastHistory : [];
    }
    cacheTimestamps[phone] = Date.now(); // Perbarui waktu akses terakhir
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
    cacheTimestamps[phone] = Date.now();

    // Bersihkan cache yang kadaluarsa sesekali
    evictStaleCache();
    
    // Simpan ke Supabase untuk sinkronisasi antar-worker
    await logChatMessage(phone, role, content);
}

/**
 * Menghapus memori (Reset)
 */
async function clearChatHistory(phone) {
    delete chatHistories[phone];
    delete cacheTimestamps[phone];
    const { clearChatHistoryDB } = require('../repositories/supabaseClient');
    await clearChatHistoryDB(phone);
}

module.exports = {
    getChatHistory,
    addMessageToMemory,
    clearChatHistory
};

