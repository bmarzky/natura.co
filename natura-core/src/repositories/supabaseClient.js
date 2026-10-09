// Mencegah crash Supabase di Node.js 20 ke bawah yang belum punya WebSocket bawaan
if (typeof global !== 'undefined' && !global.WebSocket) {
    global.WebSocket = class WebSocket {
        constructor() { throw new Error("Dummy WebSocket should not be called"); }
    };
}
const { createClient } = require('@supabase/supabase-js');

// Mengambil kredensial dari .env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Mock Transport untuk menghindari error Realtime WebSocket di Node 20
class DummyWebSocket {
    constructor() {}
    send() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
}

// Pastikan kredensial ada agar tidak error saat pertama kali dijalankan tanpa .env
const supabase = (supabaseUrl && supabaseKey) 
    ? createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
        realtime: { transport: DummyWebSocket }
    }) 
    : null;

/**
 * Menyimpan pesan chat mentah ke database (Sangat berguna untuk RAG/Training Data)
 */
async function logChatMessage(phone, role, content) {
    if (!supabase) return;
    try {
        await supabase.from('bot_chats').insert([
            { phone, role, content }
        ]);
    } catch (error) {
        console.error('[Supabase] Error logging chat:', error.message);
    }
}

/**
 * Menyimpan atau memperbarui data pesanan
 */
async function upsertOrder(phone, state) {
    if (!supabase || !state.order_id) return;
    try {
        const orderData = {
            order_id: state.order_id,
            phone: phone,
            product: state.product || null,
            quantity: state.quantity ? parseInt(state.quantity) : null,
            total: state.total ? parseInt(state.total) : 0,
            delivery_date: state.delivery_date,
            delivery_time: state.delivery_time,
            delivery_address: state.delivery_address || null,
            cake_writing: state.cake_writing, // Mengembalikan ke fungsi aslinya untuk request pelanggan
            payment_info: state.payment_info, // Menggunakan kolom baru di tabel bot_orders
            midtrans_order_id: state.midtrans_order_id, // Menyimpan Midtrans ID spesifik
            payment_method: state.payment_method,
            payment_status: state.payment_status ? state.payment_status : (state.order_status === 'awaiting_payment' ? 'pending' : 'draft'),
            is_paused: state.is_paused || false
        };

        // Upsert: Masukkan baru atau timpa jika order_id sudah ada
        const { error } = await supabase.from('bot_orders').upsert(orderData, { onConflict: 'order_id' });
        if (error) throw error;
        
    } catch (error) {
        console.error('[Supabase] Error upserting order:', error.message);
    }
}

/**
 * Mengambil memori chat sebelumnya agar AI tidak amnesia setelah restart server
 */
async function loadHistory(phone) {
    if (!supabase) return [];
    try {
        const { data, error } = await supabase
            .from('bot_chats')
            .select('role, content')
            .eq('phone', phone)
            .eq('is_archived', false)
            .order('created_at', { ascending: true })
            .limit(30); // Ambil 30 pesan terakhir agar konteks tidak terlalu berat
            
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('[Supabase] Error loading history:', error.message);
        return [];
    }
}

/**
 * Mengarsipkan memori chat (Bukan menghapus) setelah pesanan sukses agar AI tidak berhalusinasi,
 * namun data aslinya tetap aman di database untuk keperluan analitik / pantauan Admin.
 */
async function clearChatHistoryDB(phone) {
    if (!supabase) return;
    try {
        await supabase
            .from('bot_chats')
            .update({ is_archived: true })
            .eq('phone', phone)
            .eq('is_archived', false);
    } catch (error) {
        console.error('[Supabase] Error archiving history:', error.message);
    }
}

/**
 * Mengambil status pesanan terakhir agar AI ingat sampai di tahap mana
 */
async function loadOrder(phone) {
    if (!supabase) return {};
    try {
        const { data, error } = await supabase
            .from('bot_orders')
            .select('*')
            .eq('phone', phone)
            .order('created_at', { ascending: false })
            .limit(1);
            
        if (error) throw error;
        
        if (data && data.length > 0) {
            // Ubah format kembali ke format state AI
            const order = data[0];
            return {
                order_id: order.order_id,
                customer_phone: order.phone,
                product: order.product,
                quantity: order.quantity,
                total: order.total,
                delivery_date: order.delivery_date,
                delivery_time: order.delivery_time,
                delivery_address: order.delivery_address,
                cake_writing: order.cake_writing,
                payment_method: order.payment_method,
                payment_status: order.payment_status,
                order_status: order.payment_status === 'settlement' ? 'paid' : 
                              (order.payment_status === 'pending' || order.payment_status === 'pending_claimed' || order.payment_status === 'pending_warned' ? 'awaiting_payment' : 'draft'),
                payment_info: order.payment_info || (order.cake_writing && order.cake_writing.includes('VA:') ? order.cake_writing : null),
                is_paused: order.is_paused || false
            };
        }
        return {};
    } catch (error) {
        console.error('[Supabase] Error loading order:', error.message);
        return {};
    }
}

async function markChatAsRead(phone) {
    if (!supabase) return;
    try {
        await supabase.from('bot_chats').update({ is_read: true }).eq('phone', phone).eq('role', 'user');
    } catch (error) {
        console.error('[Supabase] Error marking as read:', error.message);
    }
}

async function getOrderByOrderId(orderId) {
    if (!supabase || !orderId) return null;
    try {
        // Karena order_id dari Midtrans mengandung tambahan -timestamp,
        // kita potong bagian belakangnya untuk mendapatkan ID asli di DB.
        let baseOrderId = orderId;
        if (typeof orderId === 'string' && orderId.split('-').length >= 3) {
            baseOrderId = orderId.substring(0, orderId.lastIndexOf('-'));
        }

        const { data, error } = await supabase
            .from('bot_orders')
            .select('*')
            .eq('order_id', baseOrderId)
            .limit(1);
            
        if (error) throw error;
        return data && data.length > 0 ? data[0] : null;
    } catch (error) {
        console.error('[Supabase] Error getting order by ID:', error.message);
        return null;
    }
}

async function updatePaymentStatusByOrderId(orderId, paymentStatus) {
    if (!supabase || !orderId) return;
    try {
        let baseOrderId = orderId;
        if (typeof orderId === 'string' && orderId.split('-').length >= 3) {
            baseOrderId = orderId.substring(0, orderId.lastIndexOf('-'));
        }

        await supabase
            .from('bot_orders')
            .update({ payment_status: paymentStatus })
            .eq('order_id', baseOrderId);
    } catch (error) {
        console.error('[Supabase] Error updating payment status:', error.message);
    }
}

async function getPendingOrders() {
    if (!supabase) return [];
    try {
        // Ambil order yang statusnya pending_claimed (orang yang mengaku sudah bayar)
        const { data, error } = await supabase
            .from('bot_orders')
            .select('*')
            .eq('payment_status', 'pending_claimed');
            
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('[Supabase] Error getting pending orders:', error.message);
        return [];
    }
}

module.exports = {
    logChatMessage,
    upsertOrder,
    loadHistory,
    clearChatHistoryDB,
    loadOrder,
    markChatAsRead,
    getOrderByOrderId,
    updatePaymentStatusByOrderId,
    getPendingOrders
};
