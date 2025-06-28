-- Migration script to fix therapist_posts and post_images relationship
-- This ensures posts go to therapist_posts table and images reference it correctly

-- 1. Create therapist_posts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.therapist_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for therapist_posts
ALTER TABLE therapist_posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS select_therapist_posts ON therapist_posts;
DROP POLICY IF EXISTS insert_therapist_posts ON therapist_posts;
DROP POLICY IF EXISTS update_therapist_posts ON therapist_posts;
DROP POLICY IF EXISTS delete_therapist_posts ON therapist_posts;

-- Create policies for therapist_posts
CREATE POLICY select_therapist_posts 
  ON therapist_posts FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY insert_therapist_posts 
  ON therapist_posts FOR INSERT TO authenticated 
  WITH CHECK (
    auth.uid() = author_id AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY update_therapist_posts 
  ON therapist_posts FOR UPDATE TO authenticated 
  USING (auth.uid() = author_id);

CREATE POLICY delete_therapist_posts 
  ON therapist_posts FOR DELETE TO authenticated 
  USING (auth.uid() = author_id);

-- 2. Drop existing post_images table and recreate with correct reference
DROP TABLE IF EXISTS public.post_images CASCADE;

CREATE TABLE public.post_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES therapist_posts(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for post_images
ALTER TABLE post_images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS select_post_images ON post_images;
DROP POLICY IF EXISTS insert_post_images ON post_images;

-- Create policies for post_images
CREATE POLICY select_post_images ON post_images FOR SELECT TO authenticated USING (true);

CREATE POLICY insert_post_images ON post_images FOR INSERT TO authenticated 
WITH CHECK (EXISTS (
  SELECT 1 FROM therapist_posts 
  WHERE id = post_id AND author_id = auth.uid()
));

-- 3. Recreate other related tables with therapist_posts reference
DROP TABLE IF EXISTS public.post_tags CASCADE;
CREATE TABLE public.post_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES therapist_posts(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(post_id, tag)
);

ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_post_tags ON post_tags;
DROP POLICY IF EXISTS insert_post_tags ON post_tags;

CREATE POLICY select_post_tags ON post_tags FOR SELECT TO authenticated USING (true);
CREATE POLICY insert_post_tags ON post_tags FOR INSERT TO authenticated 
WITH CHECK (EXISTS (
  SELECT 1 FROM therapist_posts 
  WHERE id = post_id AND author_id = auth.uid()
));

-- 4. Recreate post_likes table
DROP TABLE IF EXISTS public.post_likes CASCADE;
CREATE TABLE public.post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES therapist_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(post_id, user_id)
);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_post_likes ON post_likes;
DROP POLICY IF EXISTS insert_post_likes ON post_likes;
DROP POLICY IF EXISTS delete_post_likes ON post_likes;

CREATE POLICY select_post_likes ON post_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY insert_post_likes ON post_likes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY delete_post_likes ON post_likes FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 5. Recreate post_saves table
DROP TABLE IF EXISTS public.post_saves CASCADE;
CREATE TABLE public.post_saves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES therapist_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(post_id, user_id)
);

ALTER TABLE post_saves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_post_saves ON post_saves;
DROP POLICY IF EXISTS insert_post_saves ON post_saves;
DROP POLICY IF EXISTS delete_post_saves ON post_saves;

CREATE POLICY select_post_saves ON post_saves FOR SELECT TO authenticated USING (true);
CREATE POLICY insert_post_saves ON post_saves FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY delete_post_saves ON post_saves FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 6. Create helper functions for therapist_posts
CREATE OR REPLACE FUNCTION increment_therapist_post_likes(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE therapist_posts 
  SET likes = likes + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_therapist_post_likes(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE therapist_posts 
  SET likes = GREATEST(0, likes - 1) -- Prevent negative likes
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Grant access to the functions
GRANT EXECUTE ON FUNCTION increment_therapist_post_likes TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_therapist_post_likes TO authenticated;

-- 7. Create post_images storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('post_images', 'post_images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for post_images bucket
DROP POLICY IF EXISTS "Allow authenticated uploads to post_images" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to post_images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'post_images');

DROP POLICY IF EXISTS "Allow public read access to post_images" ON storage.objects;
CREATE POLICY "Allow public read access to post_images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'post_images');

DROP POLICY IF EXISTS "Allow owners to update their files in post_images" ON storage.objects;
CREATE POLICY "Allow owners to update their files in post_images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'post_images' AND owner = auth.uid())
WITH CHECK (bucket_id = 'post_images' AND owner = auth.uid());

DROP POLICY IF EXISTS "Allow owners to delete their files in post_images" ON storage.objects;
CREATE POLICY "Allow owners to delete their files in post_images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'post_images' AND owner = auth.uid()); 