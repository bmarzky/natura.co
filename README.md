# Natura House - Enterprise AI Chatbot & E-Commerce System

Natura House adalah platform digital untuk pemesanan kue klasik. Repositori ini berisi implementasi antarmuka pengguna (landing page) serta sistem chatbot cerdas (AI) *end-to-end* yang mengotomatisasi pesanan, mengintegrasikan pembayaran (*payment gateway*), dan mendukung peralihan ke agen manusia (*human-handoff*) secara *seamless*. Sistem ini dirancang untuk berjalan secara tangguh di arsitektur **cPanel Multi-Worker Node.js (Passenger)**.

---

## Struktur Proyek

- `/` (Root) : Landing page interaktif (HTML, CSS, JS) dengan UI dinamis berdasarkan waktu.
- `/natura-core` : Inti aplikasi Node.js (Express).
  - `/src/services` : Berisi otak AI (Llama-3 via Groq), Integrasi Midtrans, dan koneksi Supabase. Termasuk solusi *DummyWebSocket* untuk kompatibilitas Node 20.
  - `/src/routes` : Pengelola jalur Webhook Meta (WhatsApp) dan Endpoint API.
  - `/public/admin.html` : **Admin Dashboard (Omnichannel)**. Panel kontrol HTML khusus Admin untuk memantau status pesanan, membalas chat secara manual via WhatsApp, dan mereset status AI.
- `/api` : Folder peninggalan *backend* PHP (Legacy).
- `.env` : File konfigurasi rahasia terpusat (Groq, Midtrans, Supabase, Meta API).

---

## Fitur Utama & Arsitektur (Terbaru)

### 1. Kecerdasan Buatan (AI Bot) Berbasis Llama-3
- **Natural Language Processing (NLP)**: Bot mampu mengekstraksi pesanan (produk, kuantitas, alamat, catatan kue) melalui percakapan alami menggunakan Groq (Llama-3).
- **Multi-Worker Synchronization**: Untuk mengatasi isu amnesia pada arsitektur *multi-worker* cPanel, riwayat percakapan (`bot_chats`) dan keranjang pesanan (`bot_orders`) ditarik dari Database secara *real-time* untuk setiap pesan masuk.
- **Sistem Pembungkaman (Human-Handoff)**: Jika pelanggan komplain/marah, AI otomatis mengubah status pesanan di Database menjadi `is_paused: true`. AI membungkam dirinya sendiri dan mengirimkan notifikasi darurat ke nomor WhatsApp pribadi Admin.

### 2. Panel Admin (Omnichannel) Terpusat
- **Unread Messages & Handoff Indicators**: Admin Panel beroperasi sepenuhnya dari browser. Dilengkapi indikator Titik Biru (Pesan Belum Dibaca) dan peringatan Merah Berkedip untuk pelanggan yang membutuhkan bantuan manual.
- **Direct Meta API Injection**: Admin membalas keluhan melalui kolom input yang otomatis menembak Meta Graph API (`/send-admin`), memastikan pesan diterima pelanggan melalui nomor bisnis resmi Natura tanpa perlu membuka WhatsApp Business/Inbox FB.
- **Bot Override Control**: Terdapat tombol "Aktifkan AI Kembali" untuk mereset status `is_paused` dan menyerahkan kendali percakapan kembali kepada AI.

### 3. Otomatisasi Pembayaran (Midtrans)
- **Pembuatan Snap Token**: AI menghasilkan tautan pembayaran virtual account / QRIS dari Midtrans secara instan setelah pelanggan mengkonfirmasi pesanan.
- **Webhook Settlement**: Saat pembayaran berhasil, Webhook Midtrans membangunkan AI, yang kemudian secara proaktif menghubungi pelanggan dengan nota lunas dan ucapan terima kasih (tanpa campur tangan Admin).

---

## Panduan Konfigurasi Database (Supabase)

Sistem ini membutuhkan Database PostgreSQL (Supabase) dengan skema berikut:

### Tabel `bot_orders`
| Kolom | Tipe Data | Deskripsi |
| --- | --- | --- |
| `order_id` | text (Primary Key) | DRAFT-{phone} atau Midtrans Order ID |
| `phone` | text | Nomor WA pelanggan |
| `is_paused` | boolean (Default: false)| Penanda status Human Handoff |
| `payment_status` | text | Status bayar Midtrans |
*(serta kolom operasional produk, kuantitas, alamat, harga, waktu pengiriman, dll)*

### Tabel `bot_chats`
| Kolom | Tipe Data | Deskripsi |
| --- | --- | --- |
| `id` | uuid (Primary Key) | Auto-generated |
| `phone` | text | Nomor WA pelanggan |
| `role` | text | 'user' atau 'assistant' |
| `content` | text | Isi pesan chat |
| `is_read` | boolean (Default: false)| Indikator Pesan Baru Belum Dibaca |

---

## Panduan Instalasi (Server cPanel)

1. Clone repositori:
   ```bash
   git clone https://github.com/bmarzky/natura.co.git
   ```
2. Buat file `.env` di folder *root* server untuk menyimpan kredensial `SUPABASE_URL`, `SUPABASE_KEY`, `GROQ_API_KEY`, `WA_ACCESS_TOKEN`, `WA_PHONE_ID`, `ADMIN_PHONE`, `MIDTRANS_SERVER_KEY`, dll.
3. Konfigurasi **Setup Node.js App** di cPanel:
   - Application Root: `/natura-core`
   - Application URL: `domain.com/bot`
4. Jalankan instalasi dependensi via terminal cPanel (`npm install`), lalu klik **RESTART** pada antarmuka Node.js App.
5. Daftarkan URL Webhook (misal: `https://domain.com/bot/api/webhook/meta`) ke Meta Dashboard for Developers dengan token verifikasi yang disepakati.
6. Akses Panel Admin melalui `https://domain.com/bot/admin.html`.

---
Hak Cipta (c) 2026 bmarzky | Natura House
