# Natura House - Enterprise Chatbot & E-Commerce System

Natura House adalah platform digital untuk pemesanan kue klasik. Repositori ini berisi implementasi antarmuka pengguna (landing page) serta sistem chatbot cerdas (AI) end-to-end yang mengotomatisasi pesanan, mengintegrasikan pembayaran *payment gateway*, dan mendukung peralihan ke agen manusia (*human-handoff*) secara *seamless*.

---

## 📂 Struktur Proyek

- `/landing-page` : Aset statis antarmuka utama (HTML, CSS, JS, UI dinamis berdasarkan waktu).
- `/bot-playground` : Layanan Node.js (Express) sebagai pusat otak AI (menggunakan Groq Llama-3). Tempat webhook Midtrans, pengelolaan *State* AI, dan simulasi web-chat berjalan.
- `/admin-dashboard` : Aplikasi web mandiri khusus Admin (Omnichannel mini). Membaca chat dari database dan langsung membalas pelanggan melalui Meta API.
- `/api` : Folder peninggalan *backend* PHP untuk eksperimen webhook Meta lawas.
- `/docs` : Dokumentasi spesifikasi sistem.
- `.env` : File konfigurasi rahasia terpusat (Groq, Midtrans, Supabase, Meta API).

---

## 🚀 Fitur Utama & Arsitektur (Terbaru)

### 1. Kecerdasan Buatan (AI Bot) & State Management
- **NLP Berbasis Groq (Llama-3)**: Mengekstraksi pesanan (produk, kuantitas, tanggal, jam, alamat) dalam satu prompt terstruktur.
- **Anti-Amnesia (Supabase Persistence)**: Riwayat percakapan (`bot_chats`) dan keranjang pesanan (`bot_orders`) disimpan secara permanen. AI tidak akan lupa konteks pesanan jika server direstart.
- **Sistem Pembungkaman (Human-Handoff)**: Jika pelanggan komplain/meminta admin manusia, bot mengubah status menjadi `is_paused: true`, membungkam dirinya sendiri, dan mengirim sinyal bahaya ke Admin.

### 2. Panel Admin (Omnichannel)
- **Real-time Chat Viewer**: Menggunakan CDN Supabase JS, panel menarik seluruh daftar pelanggan dan histori *chat* secara instan.
- **Direct Meta API Injection**: Admin membalas pesan melalui kolom input yang menembak Graph API Meta secara langsung, memastikan pelanggan menerima balasan dari nomor resmi Natura House tanpa memerlukan Inbox Facebook.

### 3. Otomatisasi Pembayaran (Midtrans)
- **Pembuatan Snap Token**: AI menghasilkan token virtual account / QRIS dari Midtrans secara otomatis setelah konfirmasi pesanan.
- **Webhook Settlement**: Saat pelanggan membayar, Webhook Midtrans membangunkan AI, yang kemudian mengirimkan nota lunas dan ucapan terima kasih kepada pelanggan tanpa intervensi admin.

---

## 🛠️ Panduan Instalasi dan Konfigurasi

### 1. Inisialisasi Repositori
```bash
git clone https://github.com/bmarzky/natura.co.git
cd natura.co
```

### 2. Konfigurasi Kredensial Terpusat (.env)
Ganti seluruh konfigurasi rahasia dengan membuat file `.env` di **direktori utama (root)**:
```env
# GROQ & MIDTRANS
GROQ_API_KEY=gsk_...
MIDTRANS_SERVER_KEY=Mid-server-...
MIDTRANS_CLIENT_KEY=Mid-client-...

# SUPABASE (Database)
SUPABASE_URL=https://...supabase.co
SUPABASE_KEY=eyJ... (Service Role Key)

# WHATSAPP CLOUD META API
WA_ACCESS_TOKEN=EAA... (Token Permanen)
WA_PHONE_ID=139...
ADMIN_PHONE=62895...
```

### 3. Menjalankan Layanan (Node.js)
Masuk ke direktori *chatbot* dan instal semua dependensi:
```bash
cd bot-playground
npm install
npm start
```
- Server Bot (AI & Webhook) akan menyala di `http://localhost:3000`.
- Buka `http://localhost:3000` di browser untuk masuk ke **Simulasi Chat AI (Playground)**.

### 4. Mengoperasikan Panel Admin
Tidak perlu server khusus. Buka direktori `/admin-dashboard` dan klik dua kali (buka di browser) file `index.html`. 
Panel siap digunakan untuk merespons permintaan *Human Handoff*.

---
Hak Cipta (c) 2026 bmarzky | Natura House
