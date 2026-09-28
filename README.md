# natura.co
> "Dari rasa, lahir sebuah cerita."

natura.co adalah halaman landas (landing page) bergaya editorial premium untuk sebuah jenama (brand) kue klasik. Didesain dengan fokus pada pengalaman emosional pengguna, antarmuka situs ini memadukan estetika minimalis, animasi yang mulus, serta lingkungan yang bereaksi cerdas terhadap waktu.

## Fitur Utama

- **Atmosfer Dinamis (Time-of-Day):** Warna latar belakang, teks, dan partikel kanvas berubah secara otomatis menyesuaikan waktu lokal pengguna (Pagi, Siang, Senja, dan Malam).
- **Sistem Ulasan Interaktif:** Terintegrasi dengan Supabase untuk memuat dan menyimpan ulasan pelanggan secara langsung (real-time). Ulasan ditampilkan dalam bentuk korsel (carousel) otomatis tanpa batas.
- **Keamanan Front-End:** Dilengkapi dengan sistem Anti-XSS Sanitization dan Rate Limiter (pembatasan pengiriman form untuk mencegah spam).
- **UI/UX Premium:** Interaksi mikro, efek melayang (hover lift) yang elegan, animasi gulir (scroll-reveal), dan tipografi berkelas.
- **Status Toko Otomatis:** Memeriksa dan menampilkan indikator "Buka" atau "Tutup" berdasarkan jam operasional toko (09:00 - 21:00).

## Teknologi yang Digunakan

Proyek ini dibangun tanpa kerangka kerja (framework) berat untuk memastikan performa maksimal dan waktu pemuatan (load time) yang optimal:
- **HTML5:** Struktur semantik.
- **Vanilla CSS3:** Variabel CSS (Custom Properties) untuk manipulasi tema dinamis dan animasi.
- **Vanilla JavaScript:** IntersectionObserver API (animasi gulir), Canvas API (partikel), dan manipulasi DOM murni.
- **Supabase:** Backend-as-a-Service (BaaS) berbasis PostgreSQL untuk menyimpan jejak digital cerita pengunjung.

## Panduan Instalasi Lokal

1. **Unduh Repositori**
   ```bash
   git clone https://github.com/bmarzky/natura.co.git
   cd natura.co
   ```

2. **Konfigurasi Supabase**
   Buat file bernama `config.js` di dalam folder `js/` (`js/config.js`), lalu masukkan kunci API Anda:
   ```javascript
   const CONFIG = {
     SUPABASE_URL: "https://[ID_PROYEK_ANDA].supabase.co",
     SUPABASE_ANON_KEY: "eyJh..."
   };
   ```
   (File ini telah masuk ke dalam `.gitignore` sehingga kunci Anda tidak akan terbaca oleh repositori publik).

3. **Struktur Database (Supabase)**
   Pastikan Anda telah membuat tabel bernama `reviews` di Supabase dengan skema berikut:
   - `id` (uuid, Primary Key)
   - `created_at` (timestampz)
   - `name` (text)
   - `text` (text)
   - `rating` (int4)
   - `likes` (int4)

   Pastikan Row Level Security (RLS) diaktifkan untuk mengatur kebijakan baca (Select) dan tulis (Insert) publik.

4. **Jalankan Aplikasi**
   Anda cukup membuka file `index.html` di peramban (browser), atau disarankan menggunakan ekstensi seperti Live Server di VSCode untuk menangani pemuatan modul jika diperlukan di masa depan.

---
Didesain dengan sepenuh hati untuk mengabadikan setiap momen keluarga.
(c) 2026 natura.co
