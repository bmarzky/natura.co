# Natura House 🍃
> "Dari rasa, lahir sebuah cerita."

Natura House adalah platform digital komprehensif untuk *brand* kue klasik. Proyek ini memadukan *landing page* bergaya editorial premium dengan **Sistem Chatbot WhatsApp Cerdas bertenaga AI** untuk otomatisasi layanan dan pengalaman emosional pelanggan yang tak tertandingi.

Saat ini, repositori terbagi menjadi beberapa modul yang bekerja secara berdampingan.

---

## 🏗️ Struktur Proyek

```text
natura.co/
├── index.html            # Halaman utama (Root) yang bisa diakses langsung
├── landing-page/         # Seluruh aset (CSS, JS, Gambar, Cerita) untuk Landing Page
├── api/                  # Backend PHP untuk Webhook WhatsApp Cloud API
├── bot-playground/       # Server Node.js + Groq Llama-3 AI untuk Simulasi Bot
├── docs/                 # Dokumentasi sistem, arsitektur, dan bisnis rules (AI)
├── .gitignore            # Pengamanan file rahasia & node_modules
└── README.md             # Dokumentasi utama (Anda di sini)
```

---

## 🌟 Fitur Utama

### 1. Premium Landing Page (`/landing-page`)
- **Atmosfer Dinamis (Time-of-Day):** Warna dan partikel latar belakang bereaksi secara otomatis terhadap waktu lokal pengunjung (Pagi, Siang, Senja, dan Malam).
- **Ulasan Real-time:** Terintegrasi dengan *Supabase* untuk menampilkan testimoni otentik dari pelanggan melalui korsel interaktif.
- **Micro-Interactions:** Efek *hover lift*, animasi *scroll-reveal*, desain responsif modern, dan tipografi yang memanjakan mata.

### 2. Otak AI (Node.js) & Simulator Bot (`/bot-playground`)
- **Groq Llama-3 Powered:** Chatbot cerdas yang dapat mengobrol seperti pelayan toko manusia, dengan kemampuan negosiasi, memandu pesanan, dan verifikasi alamat secara ketat.
- **Sistem Pengingat *State*:** Bot memiliki struktur JSON untuk mengingat pesanan pengguna tanpa perlu bertanya berulang kali (*Stateful Order Tracking*).
- **Simulasi Front-End & Terminal:** Dapat diuji coba langsung melalui *web simulator* (`localhost:3000`) atau via terminal Node.js.
- **Arsitektur Modular:** Menggunakan kerangka kerja `Express.js`, dipisahkan menjadi direktori `routes/`, `services/`, dan `config/`.

### 3. Integrasi WhatsApp Cloud API (`/api`)
- **Webhook Super Cepat:** Dibangun dengan `PHP 8+` menggunakan struktur modular (`core`, `handlers`) untuk menangkap pesan WhatsApp Cloud API secara instan.
- **Fast HTTP Acknowledgment:** Menggunakan `fastcgi_finish_request()` untuk merespons webhook Meta guna mencegah error pengulangan/timeout.
- **Simulasi Animasi "Mengetik":** Dilengkapi jeda logis dan pengiriman status *"Read"* yang mulus agar interaksi bot terasa sangat organik.

---

## ⚙️ Panduan Menjalankan Sistem

### 1. Kloning Repositori
```bash
git clone https://github.com/bmarzky/natura.co.git
cd natura.co
```

### 2. Konfigurasi Frontend (Supabase)
Buat file `landing-page/js/config.js` secara manual (file ini dilindungi oleh `.gitignore`):
```javascript
const CONFIG = {
  SUPABASE_URL: "https://[ID_PROYEK_ANDA].supabase.co",
  SUPABASE_ANON_KEY: "eyJh..."
};
```

### 3. Konfigurasi Bot AI (Node.js)
1. Masuk ke folder bot dan instal *dependencies*:
```bash
cd bot-playground
npm install
```
2. Buat file `.env` di dalam folder `bot-playground`:
```env
PORT=3000
GROQ_API_KEY=gsk_apikeyanda_di_sini
```
3. Jalankan server simulator AI:
```bash
npm start
# Buka http://localhost:3000 di browser untuk mencoba bot
```

### 4. Konfigurasi Webhook WhatsApp (PHP)
Jika Anda mengunggah ke server *hosting* (seperti cPanel), buat file `api/config.php` yang dilindungi secara rahasia:
```php
<?php
$accessToken = 'MASUKKAN_TOKEN_META_ANDA';
$phoneNumberId = 'ID_NOMOR_ANDA';
$verifyToken = 'TOKEN_VERIFIKASI_WEBHOOK';
?>
```
*(Catatan: Webhook PHP saat ini berjalan dalam mode Dummy/Testing mandiri dan belum disambungkan permanen ke server Node.js).*

---
(c) 2026 bmarzky | natura house
