-- This file contains updated SQL for a more inclusive expert profiles system
-- Copy and paste this entire file into your Supabase SQL editor

-- ========== PROFILES TABLE ==========
-- Modify Profiles table to support multiple expert types
ALTER TABLE IF EXISTS public.profiles DROP CONSTRAINT IF EXISTS profiles_user_role_check;
ALTER TABLE IF EXISTS public.profiles ADD CONSTRAINT profiles_user_role_check 
  CHECK (user_role IN ('patient', 'therapist', 'counselor', 'psychologist', 'psychiatrist', 'coach', 'consultant', 'mentor', 'social_worker', 'other_expert'));

-- Add new fields to the profiles table if they don't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS certifications TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS languages TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS appointment_fee TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS session_duration TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- ========== EXPERT-CLIENT RELATIONSHIP TABLE ==========
-- Create the expert-client relationship table (replacing or alongside therapist-patient)
CREATE TABLE IF NOT EXISTS public.expert_client (
  expert_id uuid references public.profiles(id) on delete cascade not null,
  client_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (expert_id, client_id)
);

-- Enable RLS for expert_client
ALTER TABLE public.expert_client ENABLE ROW LEVEL SECURITY;

-- Policies for Expert-Client
DROP POLICY IF EXISTS "Experts/Clients can view their own connections." ON public.expert_client;
CREATE POLICY "Experts/Clients can view their own connections."
  ON public.expert_client FOR SELECT USING (auth.uid() = expert_id OR auth.uid() = client_id);

DROP POLICY IF EXISTS "Experts/Clients can create connections." ON public.expert_client;
CREATE POLICY "Experts/Clients can create connections."
  ON public.expert_client FOR INSERT WITH CHECK (auth.uid() = expert_id OR auth.uid() = client_id);

DROP POLICY IF EXISTS "Experts/Clients can delete their own connections." ON public.expert_client;
CREATE POLICY "Experts/Clients can delete their own connections."
  ON public.expert_client FOR DELETE USING (auth.uid() = expert_id OR auth.uid() = client_id);

-- Add to realtime
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expert_client;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- ========== POSTS TABLE ==========
-- Update policies for the posts table
DROP POLICY IF EXISTS "Posts are viewable by everyone." ON public.posts;
CREATE POLICY "Posts are viewable by everyone."
  ON public.posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Experts can insert posts." ON public.posts;
CREATE POLICY "Experts can insert posts."
  ON public.posts FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    (SELECT user_role FROM public.profiles WHERE id = auth.uid()) IN 
    ('therapist', 'counselor', 'psychologist', 'psychiatrist', 'coach', 'consultant', 'mentor', 'social_worker', 'other_expert')
  );

DROP POLICY IF EXISTS "Experts can update their own posts." ON public.posts;
CREATE POLICY "Experts can update their own posts."
  ON public.posts FOR UPDATE USING (
    auth.uid() = user_id AND
    (SELECT user_role FROM public.profiles WHERE id = auth.uid()) IN 
    ('therapist', 'counselor', 'psychologist', 'psychiatrist', 'coach', 'consultant', 'mentor', 'social_worker', 'other_expert')
  );

DROP POLICY IF EXISTS "Experts can delete their own posts." ON public.posts;
CREATE POLICY "Experts can delete their own posts."
  ON public.posts FOR DELETE USING (
    auth.uid() = user_id AND
    (SELECT user_role FROM public.profiles WHERE id = auth.uid()) IN 
    ('therapist', 'counselor', 'psychologist', 'psychiatrist', 'coach', 'consultant', 'mentor', 'social_worker', 'other_expert')
  );

-- ========== THERAPIST_POSTS TABLE UPDATES ==========
-- Rename therapist_posts table to expert_posts (this will create a new table)
CREATE TABLE IF NOT EXISTS public.expert_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE expert_posts ENABLE ROW LEVEL SECURITY;

-- Policies for expert_posts
CREATE POLICY select_expert_posts 
  ON expert_posts FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY insert_expert_posts 
  ON expert_posts FOR INSERT TO authenticated 
  WITH CHECK (
    auth.uid() = author_id AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND 
      user_role IN ('therapist', 'counselor', 'psychologist', 'psychiatrist', 'coach', 'consultant', 'mentor', 'social_worker', 'other_expert')
    )
  );

CREATE POLICY update_expert_posts 
  ON expert_posts FOR UPDATE TO authenticated 
  USING (auth.uid() = author_id);

CREATE POLICY delete_expert_posts 
  ON expert_posts FOR DELETE TO authenticated 
  USING (auth.uid() = author_id);

-- Update related tables to reference expert_posts instead of therapist_posts
CREATE TABLE IF NOT EXISTS public.post_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES expert_posts(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.post_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES expert_posts(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.post_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES expert_posts(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(post_id, tag)
);

CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES expert_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.post_saves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES expert_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(post_id, user_id)
);

-- Enable RLS on all post-related tables
ALTER TABLE post_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_saves ENABLE ROW LEVEL SECURITY;

-- RLS policies for post-related tables
CREATE POLICY select_post_images ON post_images FOR SELECT TO authenticated USING (true);
CREATE POLICY select_post_videos ON post_videos FOR SELECT TO authenticated USING (true);
CREATE POLICY select_post_tags ON post_tags FOR SELECT TO authenticated USING (true);
CREATE POLICY select_post_likes ON post_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY select_post_saves ON post_saves FOR SELECT TO authenticated USING (true);

-- Allow any expert to create post content
CREATE POLICY insert_post_images ON post_images FOR INSERT TO authenticated 
WITH CHECK (EXISTS (
  SELECT 1 FROM expert_posts 
  WHERE id = post_id AND author_id = auth.uid()
));

CREATE POLICY insert_post_videos ON post_videos FOR INSERT TO authenticated 
WITH CHECK (EXISTS (
  SELECT 1 FROM expert_posts 
  WHERE id = post_id AND author_id = auth.uid()
));

CREATE POLICY insert_post_tags ON post_tags FOR INSERT TO authenticated 
WITH CHECK (EXISTS (
  SELECT 1 FROM expert_posts 
  WHERE id = post_id AND author_id = auth.uid()
));

-- Insert policies for likes and saves for any authenticated user
CREATE POLICY insert_post_likes ON post_likes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY insert_post_saves ON post_saves FOR INSERT TO authenticated WITH CHECK (true);

-- Delete policies
CREATE POLICY delete_post_likes ON post_likes FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY delete_post_saves ON post_saves FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Update the get_post_details function
CREATE OR REPLACE FUNCTION get_post_details()
RETURNS TABLE (
  id UUID,
  author_id UUID,
  author_name TEXT,
  author_avatar TEXT,
  author_title TEXT,
  content TEXT,
  images TEXT[],
  video TEXT,
  tags TEXT[],
  likes_count INTEGER,
  comments_count INTEGER,
  shares_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  liked BOOLEAN,
  saved BOOLEAN
) AS $$
DECLARE
  current_user_id UUID := auth.uid();
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.author_id,
    prof.full_name AS author_name,
    prof.avatar_url AS author_avatar,
    COALESCE(prof.title, prof.specialization) AS author_title,
    p.content,
    COALESCE(ARRAY_AGG(DISTINCT pi.image_url) FILTER (WHERE pi.image_url IS NOT NULL), '{}') AS images,
    (SELECT pv.video_url FROM post_videos pv WHERE pv.post_id = p.id LIMIT 1) AS video,
    COALESCE(ARRAY_AGG(DISTINCT pt.tag) FILTER (WHERE pt.tag IS NOT NULL), '{}') AS tags,
    p.likes AS likes_count,
    p.comments AS comments_count,
    p.shares AS shares_count,
    p.created_at,
    (SELECT EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = current_user_id)) AS liked,
    (SELECT EXISTS(SELECT 1 FROM post_saves ps WHERE ps.post_id = p.id AND ps.user_id = current_user_id)) AS saved
  FROM 
    expert_posts p
  JOIN 
    profiles prof ON p.author_id = prof.id
  LEFT JOIN 
    post_images pi ON p.id = pi.post_id
  LEFT JOIN 
    post_tags pt ON p.id = pt.post_id
  GROUP BY 
    p.id, prof.full_name, prof.avatar_url, prof.title, prof.specialization
  ORDER BY 
    p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION get_post_details() TO authenticated;

-- Create stored procedures for incrementing and decrementing post likes count
CREATE OR REPLACE FUNCTION increment_post_likes(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE expert_posts 
  SET likes = likes + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_post_likes(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE expert_posts 
  SET likes = GREATEST(0, likes - 1) -- Prevent negative likes
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Grant access to the functions
GRANT EXECUTE ON FUNCTION increment_post_likes TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_post_likes TO authenticated;

-- Storage setup for avatars and post images
DO $$
BEGIN
  -- Create user-content bucket if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'user-content'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('user-content', 'user-content', false);
  END IF;
  
  -- Create post_images bucket if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'post_images'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('post_images', 'post_images', true);
    
    -- Ensure the bucket is publicly accessible for viewing images
    UPDATE storage.buckets
    SET public = true
    WHERE name = 'post_images';
  END IF;
END $$;

-- User avatar policies
CREATE POLICY "Users can upload their own avatars" 
  ON storage.objects FOR INSERT 
  TO authenticated 
  WITH CHECK (
    bucket_id = 'user-content' AND 
    (storage.foldername(name))[1] = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[2]
  );

CREATE POLICY "Users can view avatars" 
  ON storage.objects FOR SELECT 
  TO authenticated 
  USING (
    bucket_id = 'user-content' AND 
    (storage.foldername(name))[1] = 'avatars'
  );

CREATE POLICY "Users can update their own avatars" 
  ON storage.objects FOR UPDATE 
  TO authenticated 
  USING (
    bucket_id = 'user-content' AND 
    (storage.foldername(name))[1] = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[2]
  );

CREATE POLICY "Users can delete their own avatars" 
  ON storage.objects FOR DELETE 
  TO authenticated 
  USING (
    bucket_id = 'user-content' AND 
    (storage.foldername(name))[1] = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[2]
  );

-- Post images storage policies
CREATE POLICY "Allow authenticated uploads to post_images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'post_images');

CREATE POLICY "Allow public read access to post_images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'post_images');

CREATE POLICY "Allow owners to update their files in post_images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'post_images' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'post_images' AND owner = auth.uid());

CREATE POLICY "Allow owners to delete their files in post_images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'post_images' AND owner = auth.uid()); 