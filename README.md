# Natura House

Natura House adalah platform digital untuk pemesanan kue klasik. Repositori ini berisi implementasi antarmuka pengguna (landing page) dan sistem chatbot WhatsApp berbasis kecerdasan buatan (AI) yang terintegrasi untuk menangani pesanan pelanggan secara otomatis.

---

## Struktur Proyek

- `/landing-page`: Aset statis untuk antarmuka pengguna (CSS, JS, Gambar, Dokumen HTML terkait).
- `/api`: Backend PHP untuk penanganan Webhook WhatsApp Cloud API.
- `/bot-playground`: Layanan Node.js dan integrasi Groq Llama-3 AI untuk pemrosesan pesan (Chatbot).
- `/docs`: Dokumentasi spesifikasi sistem dan aturan bisnis.
- `index.html`: Entry point antarmuka pengguna utama.

---

## Fitur Utama

### 1. Antarmuka Pengguna (Landing Page)
- **Penyesuaian Visual Berbasis Waktu**: Warna latar dan elemen visual merespons waktu akses lokal pengguna secara dinamis.
- **Integrasi Database Real-time**: Menggunakan Supabase untuk menampilkan data ulasan pelanggan secara langsung pada antarmuka.

### 2. Layanan AI Chatbot
- **Pemrosesan Bahasa Alami**: Memanfaatkan model Llama-3 via Groq API untuk memahami dan merespons konteks percakapan secara terstruktur.
- **Manajemen Konteks (Stateful Tracking)**: Menyimpan detail pemesanan pengguna ke dalam memori berformat JSON untuk mencegah redundansi pengumpulan data selama sesi berlangsung.
- **Simulasi Pengujian**: Dilengkapi dengan arsitektur Express.js yang memfasilitasi pengujian alur percakapan secara mandiri pada lingkungan lokal.

### 3. Integrasi WhatsApp Cloud API
- **Pemrosesan Webhook Asinkron**: Menggunakan `fastcgi_finish_request()` pada backend PHP untuk memberikan HTTP acknowledgment instan guna mencegah kendala timeout dari sisi server Meta.
- **Pengelolaan Status Pesan**: Secara otomatis mengirimkan pembaruan status pengiriman (Read) kepada pengguna untuk menyimulasikan interaksi dua arah secara prosedural.

---

## Panduan Instalasi dan Konfigurasi

### 1. Inisialisasi Repositori
```bash
git clone https://github.com/bmarzky/natura.co.git
cd natura.co
```

### 2. Konfigurasi Kredensial Frontend
Buat file `landing-page/js/config.js` secara manual dan tambahkan kredensial Supabase Anda:
```javascript
const CONFIG = {
  SUPABASE_URL: "URL_PROYEK_SUPABASE_ANDA",
  SUPABASE_ANON_KEY: "ANON_KEY_SUPABASE_ANDA"
};
```

### 3. Konfigurasi Layanan AI (Node.js)
Masuk ke direktori chatbot, instal dependensi yang diperlukan, dan atur kredensial API:
```bash
cd bot-playground
npm install
```
Buat file `.env` pada direktori tersebut:
```env
PORT=3000
GROQ_API_KEY=KUNCI_API_GROQ_ANDA
```
Jalankan server untuk memulai simulasi pengujian:
```bash
npm start
```

### 4. Konfigurasi Webhook (PHP)
Pada lingkungan produksi (server web), buat file rahasia `api/config.php` dengan parameter berikut:
```php
<?php
$accessToken = 'TOKEN_AKSES_META';
$phoneNumberId = 'ID_NOMOR_TELEPON';
$verifyToken = 'TOKEN_VERIFIKASI_WEBHOOK';
?>
```

---
Hak Cipta (c) 2026 bmarzky | Natura House
