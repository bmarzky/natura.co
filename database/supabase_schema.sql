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
