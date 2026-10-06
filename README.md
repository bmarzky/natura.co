# natura.co
> "Dari rasa, lahir sebuah cerita."

natura.co adalah platform digital komprehensif untuk brand kue klasik. Proyek ini memadukan *landing page* bergaya editorial premium dengan **Sistem Chatbot WhatsApp Cerdas (Cloud API)** untuk otomatisasi layanan dan pengalaman emosional pelanggan yang tak tertandingi.

## Fitur Utama

### 1. WhatsApp Cloud API Chatbot (Baru)
- **Arsitektur Enterprise:** Dibangun dengan struktur modular (`config`, `core`, `handlers`) di folder `api/` untuk pemisahan logika dan keamanan tingkat tinggi.
- **Fast HTTP Acknowledgment:** Menggunakan `fastcgi_finish_request()` untuk merespons webhook Meta secara instan tanpa antrean (mencegah *delay*).
- **Simulasi Natural (Human-like):** Bot secara otomatis mengubah status pesan menjadi centang biru (*Read*) dan menampilkan status *"sedang mengetik..."* sebelum membalas.
- **Smart Intent Parsing:** Deteksi kata kunci khusus (contoh: *harga*, *pesan*, *alamat*) untuk memandu pengguna berbelanja di Katalog Meta Commerce secara mulus.

### 2. Premium Landing Page
- **Atmosfer Dinamis (Time-of-Day):** Warna dan partikel latar belakang bereaksi secara otomatis terhadap waktu lokal pengunjung (Pagi, Siang, Senja, dan Malam).
- **Ulasan Real-time:** Terintegrasi dengan *Supabase* untuk menampilkan testimoni otentik dari pelanggan melalui sistem korsel interaktif.
- **Keamanan Front-End:** Dilengkapi dengan fitur *Anti-XSS Sanitization* dan *Rate Limiter* untuk mencegah *spam*.
- **UI/UX Elegan:** Dilengkapi interaksi mikro, efek *hover lift*, animasi *scroll-reveal*, dan tipografi yang memanjakan mata.

## Teknologi yang Digunakan
- **Frontend:** HTML5 Semantik, Vanilla CSS3 (Custom Properties), Vanilla JavaScript (IntersectionObserver, Canvas API).
- **Backend (Chatbot):** PHP 8+, cURL, Webhooks, Meta Graph API v20.0.
- **Database (Ulasan):** Supabase (PostgreSQL) dengan Row Level Security (RLS).

## Panduan Pengaturan Server (Deployment)

### 1. Unduh Repositori
```bash
git clone https://github.com/bmarzky/natura.co.git
cd natura.co
```

### 2. Konfigurasi Backend (WhatsApp Bot)
Rahasia Anda dikunci rapat. Anda harus membuat file rahasia secara manual di server (seperti cPanel):
1. Buka folder `api/config/`.
2. Buat file baru bernama `config.php` (file ini dilindungi otomatis oleh `.gitignore`).
3. Masukkan kredensial dari Meta Dashboard Anda:
```php
<?php
$accessToken = 'MASUKKAN_TOKEN_META_ANDA';
$phoneNumberId = 'ID_NOMOR_ANDA';
$verifyToken = 'TOKEN_VERIFIKASI_WEBHOOK';
?>
```

### 3. Konfigurasi Frontend (Supabase)
Sama seperti backend, Anda perlu membuat file `js/config.js` secara manual:
```javascript
const CONFIG = {
  SUPABASE_URL: "https://[ID_PROYEK_ANDA].supabase.co",
  SUPABASE_ANON_KEY: "eyJh..."
};
```
*(Pastikan Anda telah membuat tabel `reviews` di Supabase).*

---
(c) 2026 bmarzky
