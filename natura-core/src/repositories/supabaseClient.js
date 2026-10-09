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
            product: state.product || 'Unknown',
            quantity: parseInt(state.quantity) || 1,
            total: parseInt(state.total) || 0,
            delivery_date: state.delivery_date,
            delivery_time: state.delivery_time,
            delivery_address: state.delivery_address || 'Pickup',
            cake_writing: state.payment_info ? state.payment_info : state.cake_writing, // Simpan info VA ke kolom cake_writing
            payment_method: state.payment_method,
            payment_status: state.order_status === 'awaiting_payment' ? 'pending' : (state.payment_status || 'draft'),
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
                order_status: order.payment_status === 'settlement' ? 'paid' : (order.payment_status === 'pending' ? 'awaiting_payment' : 'draft'),
                payment_info: order.cake_writing && order.cake_writing.includes('VA:') ? order.cake_writing : null, // Hack: simpan VA di field cake_writing jika db tak punya kolom
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

module.exports = {
    logChatMessage,
    upsertOrder,
    loadHistory,
    loadOrder,
    markChatAsRead
};
