# Natura House - Enterprise Multi-Agent AI System

Natura House adalah platform digital untuk pemesanan kue klasik. Repositori ini berisi implementasi antarmuka pengguna (landing page) serta sistem chatbot cerdas (AI) *end-to-end* yang kini beroperasi dengan arsitektur **Enterprise Multi-Agent (Divisional AI)**. Sistem ini mengotomatisasi pesanan, mengintegrasikan pembayaran Midtrans, dan mendukung peralihan ke agen manusia (*human-handoff*) secara *seamless*. Sistem ini dirancang untuk berjalan secara tangguh di arsitektur **cPanel Multi-Worker Node.js (Passenger)**.

---

## Struktur Proyek Terbaru (Domain-Driven Design)

```text
natura/
├── index.html                     # Website & aset publik (UI Dinamis)
├── .env                           # Konfigurasi rahasia (Groq, Midtrans, Supabase)
└── natura-core/                   # Inti arsitektur Node.js
    ├── index.js                   # Entry point aplikasi (Server)
    ├── package.json
    ├── public/
    │   └── admin.html             # Admin Dashboard (Omnichannel)
    └── src/
        ├── app.js                 # Konfigurasi rute Express
        ├── orchestrator/          
        │   └── businessManager.js # Pengatur lalu lintas pesan (CEO AI)
        ├── workers/               
        │   ├── sales/             # Divisi Sales & Customer Service
        │   │   └── salesWorker.js
        │   └── finance/           # Divisi Finance (Cek mutasi Midtrans)
        │       └── financeWorker.js
        ├── ai/                    
        │   ├── modelGateway.js    # Koneksi ke LLM (Groq Llama-3)
        │   └── memoryService.js   # Sistem penyimpan memori percakapan
        ├── config/                
        │   └── prompts/           # Kumpulan SOP untuk tiap divisi (Sales & Finance)
        ├── integrations/          
        │   ├── midtrans/          # Layanan Webhook & Snap Midtrans
        │   └── kemendesa/         # API eksternal (Pencarian Desa Bireuen)
        ├── repositories/          
        │   └── supabaseClient.js  # Interaksi langsung dengan Database
        └── routes/                
            ├── chatRoutes.js      # Endpoint untuk Admin Dashboard
            └── webhookRoutes.js   # Endpoint penerima Webhook Meta
```

---

## Fitur Utama & Arsitektur Multi-Agent

### 1. Pembagian Tugas AI (Divisional Agents)
Sistem tidak lagi menggunakan satu bot besar, melainkan banyak bot kecil yang ahli di bidangnya:
- **Sales Agent**: Berkomunikasi dengan ramah, memandu pembeli sampai keranjang belanja terkunci (`awaiting_payment`).
- **Finance Agent**: Memiliki akses langsung ke server Midtrans. Ia akan memeriksa mutasi, menginformasikan cara transfer, dan melakukan penagihan.
- **Business Manager (Orchestrator)**: Menjadi pengatur lalu lintas pesan agar tidak terjadi tumpang tindih jawaban antar agen.

### 2. Panel Admin (Omnichannel) Terpusat
- **Unread Messages & Handoff Indicators**: Dilengkapi indikator Titik Biru (Pesan Belum Dibaca) dan peringatan Merah Berkedip untuk pelanggan yang membutuhkan bantuan manual.
- **Sistem Pembungkaman Darurat (Human-Handoff)**: Jika pelanggan komplain (misal: "kue basi") atau marah, Sales Agent akan mengubah *intent* menjadi `human_handoff`. AI membungkam dirinya sendiri (`is_paused: true`) dan mengirim pesan darurat ke nomor WhatsApp pribadi Admin.
- **Bot Override Control**: Terdapat tombol "Aktifkan AI Kembali" untuk mereset status `is_paused` dan menyerahkan kendali kembali kepada agen AI.

### 3. Sinkronisasi Memori Jarak Jauh (Amnesia Fix)
- Mengatasi isu "amnesia" pada arsitektur *multi-worker* cPanel dengan menarik riwayat percakapan (`bot_chats`) dan *state* keranjang pesanan (`bot_orders`) dari Database secara *real-time* sebelum agen AI merespons pesan.

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
2. Konfigurasi **Setup Node.js App** di cPanel:
   - Application Root: `public_html/natura-core` *(atau sesuaikan letak root Anda)*
   - Application URL: `natura-house.shop/bot`
   - Startup File: `index.js`
3. Buat file `.env` di dalam direktori `natura-core` berisi kredensial Anda.
4. Klik **RUN NPM INSTALL** pada cPanel untuk memasang dependensi (pastikan sudah menekan tombol *Save*).
5. Klik **RESTART** pada antarmuka Node.js App cPanel.
6. Daftarkan URL Webhook: `https://natura-house.shop/bot/api/webhook/meta` ke Meta Dashboard.
7. Buka Panel Admin melalui: `https://natura-house.shop/bot/admin.html`.

---
Hak Cipta (c) 2026 bmarzky | Natura House
