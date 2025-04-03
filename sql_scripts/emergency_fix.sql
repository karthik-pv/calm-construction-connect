/*
EMERGENCY FIX SCRIPT
Run this in Supabase SQL Editor to fix the posts functionality
This will:
1. Create all required tables from scratch
2. Add necessary functions
3. Configure minimal RLS policies
*/

-- Make sure we have uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the therapist_posts table without dependencies
DO $$
BEGIN
  -- Only create if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'therapist_posts') THEN
    CREATE TABLE public.therapist_posts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      author_id UUID NOT NULL,
      content TEXT NOT NULL,
      likes INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
    );
    
    -- Let anyone access for now
    ALTER TABLE public.therapist_posts ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Allow full access to therapist_posts" ON public.therapist_posts FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Create the post_images table
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'post_images') THEN
    CREATE TABLE public.post_images (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      post_id UUID NOT NULL REFERENCES public.therapist_posts(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      position INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
    );
    
    ALTER TABLE public.post_images ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Allow full access to post_images" ON public.post_images FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Create the post_tags table
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'post_tags') THEN
    CREATE TABLE public.post_tags (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      post_id UUID NOT NULL REFERENCES public.therapist_posts(id) ON DELETE CASCADE,
      tag TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
      UNIQUE(post_id, tag)
    );
    
    ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Allow full access to post_tags" ON public.post_tags FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Create post_likes table
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'post_likes') THEN
    CREATE TABLE public.post_likes (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      post_id UUID NOT NULL REFERENCES public.therapist_posts(id) ON DELETE CASCADE,
      user_id UUID NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
      UNIQUE(post_id, user_id)
    );
    
    ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Allow full access to post_likes" ON public.post_likes FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Create post_saves table for user saves
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'post_saves') THEN
    CREATE TABLE public.post_saves (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      post_id UUID NOT NULL REFERENCES public.therapist_posts(id) ON DELETE CASCADE,
      user_id UUID NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
      UNIQUE(post_id, user_id)
    );
    
    ALTER TABLE public.post_saves ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Allow full access to post_saves" ON public.post_saves FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Create direct post creation function that bypasses any dependencies
CREATE OR REPLACE FUNCTION create_post_direct(p_content TEXT, p_author_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_post_id UUID;
BEGIN
  -- Insert the post
  INSERT INTO public.therapist_posts (content, author_id, likes)
  VALUES (p_content, p_author_id, 0)
  RETURNING id INTO new_post_id;
  
  RETURN new_post_id;
END;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION create_post_direct TO authenticated;

-- Create debug function to show a user's posts
CREATE OR REPLACE FUNCTION get_my_posts()
RETURNS TABLE (
  id UUID,
  author_id UUID,
  content TEXT,
  likes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.author_id,
    p.content,
    p.likes,
    p.created_at
  FROM 
    public.therapist_posts p
  WHERE
    p.author_id = auth.uid()
  ORDER BY 
    p.created_at DESC;
END;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION get_my_posts TO authenticated;

-- Create a function to get all post details for frontend with minimal dependencies
CREATE OR REPLACE FUNCTION get_post_details_simple()
RETURNS TABLE (
  id UUID,
  author_id UUID,
  content TEXT,
  likes_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    p.id,
    p.author_id,
    p.content,
    p.likes AS likes_count,
    p.created_at
  FROM 
    public.therapist_posts p
  ORDER BY 
    p.created_at DESC;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION get_post_details_simple TO authenticated;

-- Create a function to check if posts exist for a user
CREATE OR REPLACE FUNCTION user_has_posts(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.therapist_posts 
    WHERE author_id = user_id
  );
END;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION user_has_posts TO authenticated;

-- Create a function to get post images
CREATE OR REPLACE FUNCTION get_post_images(p_post_id UUID)
RETURNS TABLE (
  image_url TEXT,
  position INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.image_url,
    i.position
  FROM 
    public.post_images i
  WHERE
    i.post_id = p_post_id
  ORDER BY 
    i.position ASC;
END;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION get_post_images TO authenticated;

-- Insert a sample post for testing
INSERT INTO public.therapist_posts (content, author_id, likes)
VALUES (
  'This is a test post created by the emergency fix script. If you see this, the script worked!',
  auth.uid(),
  0
); 