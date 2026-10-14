# Natura House — Enterprise Multi-Agent AI System

Natura House adalah platform digital untuk pemesanan kue. Repositori ini berisi implementasi landing page serta sistem chatbot AI *end-to-end* yang beroperasi dengan arsitektur **Enterprise Multi-Agent (Divisional AI)**. Sistem ini mengotomatisasi pesanan, mengintegrasikan pembayaran Midtrans, dan mendukung peralihan ke agen manusia (*human-handoff*) secara *seamless*. Dirancang untuk berjalan di hosting **cPanel dengan LiteSpeed Node.js**.

---

## Struktur Proyek

```text
natura/
├── .env                               # Konfigurasi rahasia (tidak di-commit)
├── index.html                         # Landing page publik
└── natura-core/                       # Inti sistem Node.js
    ├── index.js                       # Entry point — menjalankan Express server
    ├── package.json
    ├── public/
    │   ├── admin.html                 # Panel Admin (Omnichannel Dashboard)
    │   └── index.html                 # Halaman default public
    └── src/
        ├── app.js                     # Konfigurasi Express dan routing
        ├── orchestrator/
        │   └── businessManager.js     # Pengatur lalu lintas pesan (Orchestrator)
        ├── workers/
        │   ├── sales/
        │   │   └── salesWorker.js     # Agen Sales dan Customer Service
        │   └── finance/
        │       └── financeWorker.js   # Agen Finance (verifikasi pembayaran Midtrans)
        ├── ai/
        │   ├── modelGateway.js        # Koneksi ke LLM via Groq API
        │   └── memoryService.js       # Manajemen memori percakapan (RAM + Supabase)
        ├── config/
        │   └── prompts/
        │       ├── salesPrompt.js     # SOP dan persona untuk Sales Agent
        │       └── financePrompt.js   # SOP dan persona untuk Finance Agent
        ├── integrations/
        │   ├── midtrans/
        │   │   └── midtransService.js # Core API dan Snap Midtrans
        │   └── kemendesa/
        │       └── locationService.js # Fetch dan cache data desa (Kota Juang)
        ├── repositories/
        │   └── supabaseClient.js      # Semua interaksi langsung dengan database
        ├── routes/
        │   ├── chatRoutes.js          # Endpoint untuk Panel Admin
        │   └── webhookRoutes.js       # Endpoint Webhook Meta dan Midtrans
        └── utils/
            └── geocodingService.js    # Reverse geocoding koordinat via Nominatim
```

---

## Fitur dan Arsitektur

### Divisional Multi-Agent

Sistem menggunakan arsitektur agen terpisah, bukan satu bot monolitik:

- **Sales Agent** (`salesWorker.js`): Menyambut pelanggan, memandu pengumpulan data pesanan (produk, kuantitas, tanggal, jam, alamat), rekap, dan mengarahkan ke pembayaran.
- **Finance Agent** (`financeWorker.js`): Memeriksa status transaksi ke Midtrans secara *real-time*, menginformasikan cara transfer, dan menangani klaim pembayaran.
- **Business Manager** (`businessManager.js`): Bertindak sebagai orchestrator yang menentukan agen mana yang aktif berdasarkan `order_status`, mengirim pesan ke WhatsApp, dan menangani webhook pembayaran.

### Pengiriman Pesan ke WhatsApp (Meta Cloud API)

- Menggunakan **Meta WhatsApp Cloud API v21.0**.
- Dilengkapi mekanisme **retry otomatis 3 kali** dengan *exponential backoff* jika pengiriman pesan gagal.
- Mendukung tiga tipe pesan masuk: `text`, `image`, dan `location` (pin lokasi pelanggan dikonversi ke nama desa via reverse geocoding).

### Manajemen Memori Percakapan

- Percakapan disimpan di **RAM (in-process cache)** untuk kecepatan akses.
- Cache dibatasi maksimal **500 pengguna aktif** dan otomatis dihapus setelah **2 jam tidak aktif** untuk mencegah kebocoran memori.
- Riwayat percakapan disinkronkan ke **Supabase** agar tidak hilang saat server restart.

### Integrasi Pembayaran (Midtrans)

- Mendukung Virtual Account BSI, BNI, BRI, BCA, Mandiri eChannel, GoPay, dan QRIS via **Midtrans Core API**.
- *Fallback* ke **Midtrans Snap** jika metode pembayaran spesifik tidak tersedia.
- Status pembayaran diverifikasi secara otomatis melalui **Webhook Midtrans**.
- **Cron Job** (`GET /api/webhook/cron/check-pending`) mengirim notifikasi peringatan ke pelanggan yang belum menyelesaikan pembayaran dalam 5—120 menit.

### Panel Admin (Omnichannel)

- Indikator pesan belum dibaca dan status *human-handoff*.
- Tombol **Aktifkan AI Kembali** untuk mereset status `is_paused` setelah admin selesai menangani pelanggan secara manual.
- Kemampuan mengirim pesan langsung ke pelanggan dari dashboard.

---

## Skema Database (Supabase PostgreSQL)

### Tabel `bot_orders`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `order_id` | text (PK) | ID unik pesanan |
| `phone` | text | Nomor WhatsApp pelanggan |
| `product` | text | Nama produk |
| `quantity` | integer | Jumlah pesanan |
| `total` | integer | Total harga (Rp) |
| `delivery_date` | text | Tanggal pengiriman |
| `delivery_time` | text | Jam pengiriman |
| `delivery_address` | text | Alamat atau "pickup" |
| `cake_writing` | text | Tulisan di kue (jika ada) |
| `payment_method` | text | Metode pembayaran |
| `payment_status` | text | Status: draft, pending, settlement, dll |
| `payment_info` | text | Detail VA / link pembayaran |
| `midtrans_order_id` | text | Order ID spesifik Midtrans |
| `is_paused` | boolean | Status human-handoff |

### Tabel `bot_chats`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid (PK) | Auto-generated |
| `phone` | text | Nomor WhatsApp pelanggan |
| `role` | text | `user` atau `assistant` |
| `content` | text | Isi pesan |
| `is_read` | boolean | Status pesan dibaca oleh admin |
| `is_archived` | boolean | Arsip setelah pesanan selesai |
| `created_at` | timestamptz | Waktu pesan dibuat |

---

## Konfigurasi Environment (`.env`)

Buat file `.env` di dalam direktori `natura-core/` (satu level di atas `src/`):

```env
# Groq LLM API
GROQ_API_KEY=gsk_...

# Midtrans
MIDTRANS_SERVER_KEY=Mid-server-...
MIDTRANS_CLIENT_KEY=Mid-client-...

# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_KEY=eyJ...

# WhatsApp Cloud API (Meta)
WA_ACCESS_TOKEN=EAAX...       # Token permanen dari System User
WA_PHONE_ID=1234567890        # Phone Number ID dari Meta Developer
WA_VERIFY_TOKEN=TOKEN_RAHASIA # Token untuk verifikasi webhook

# Admin
ADMIN_PHONE=628xxxxxxxxxx     # Nomor WA admin (format internasional, tanpa +)
```

> Token `WA_ACCESS_TOKEN` harus dibuat melalui **Meta Business Manager > System Users** dengan expiry diset ke **Never** agar permanen.

---

## Instalasi di cPanel (LiteSpeed Node.js)

1. Clone repositori ke server:
   ```bash
   git clone https://github.com/bmarzky/natura.co.git ~/public_html
   ```

2. Konfigurasi **Setup Node.js App** di cPanel:
   - Application Root: `public_html/natura-core`
   - Application URL: `natura-house.shop/bot` (sesuaikan domain)
   - Startup File: `index.js`
   - Node.js Version: `22.x`

3. Buat file `.env` di dalam `public_html/natura-core/` berisi semua kredensial di atas.

4. Klik **Run NPM Install** di cPanel untuk memasang dependensi.

5. Klik **Start** atau **Restart** untuk menjalankan aplikasi.

6. Daftarkan URL Webhook ke **Meta Developer Dashboard**:
   - Callback URL: `https://natura-house.shop/bot/api/webhook/meta`
   - Verify Token: nilai `WA_VERIFY_TOKEN` dari file `.env`

7. Akses Panel Admin: `https://natura-house.shop/bot/admin.html`

### Update Kode

Setiap ada perubahan kode, jalankan di terminal SSH:

```bash
cd ~/public_html/natura-core
git pull origin main
```

Kemudian restart aplikasi via **cPanel > Setup Node.js App > Restart**.

---

## Endpoint API

| Method | Path | Fungsi |
|---|---|---|
| `GET` | `/api/webhook/meta` | Verifikasi webhook Meta |
| `POST` | `/api/webhook/meta` | Menerima pesan masuk WhatsApp |
| `POST` | `/api/webhook/midtrans` | Menerima notifikasi pembayaran |
| `GET` | `/api/webhook/cron/check-pending` | Cron job cek pembayaran tertunda |
| `POST` | `/api/chat` | Kirim pesan via Admin Dashboard |
| `GET` | `/api/chat/status/:phone` | Cek status bot untuk nomor tertentu |
| `POST` | `/api/chat/unpause` | Aktifkan kembali bot setelah handoff |
| `POST` | `/api/chat/send-admin` | Kirim pesan manual dari admin |
| `POST` | `/api/chat/mark-read/:phone` | Tandai pesan sebagai sudah dibaca |

---

Copyright (c) 2026 bmarzky — Natura House
