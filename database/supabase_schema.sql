-- Buat tabel reviews
CREATE TABLE reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  text text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  likes integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Mengaktifkan Row Level Security (RLS)
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Memberikan akses baca untuk publik (anon)
CREATE POLICY "Allow public read access" ON reviews
  FOR SELECT USING (true);

-- Memberikan akses insert untuk publik (anon)
CREATE POLICY "Allow public insert access" ON reviews
  FOR INSERT WITH CHECK (true);

-- Memberikan akses update untuk publik (terutama untuk menambah jumlah likes)
CREATE POLICY "Allow public update access" ON reviews
  FOR UPDATE USING (true);

-- Tabel untuk Bot AI Chat Logs (Penting untuk RAG/Data Latih)
CREATE TABLE bot_chats (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  phone text NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabel untuk Bot Orders (Simpan pesanan yang berhasil)
CREATE TABLE bot_orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id text UNIQUE NOT NULL,
  phone text NOT NULL,
  product text NOT NULL,
  quantity integer NOT NULL,
  total integer NOT NULL,
  delivery_date text,
  delivery_address text,
  payment_method text,
  payment_status text DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
