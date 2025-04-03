-- Essential tables for Posts functionality
CREATE TABLE IF NOT EXISTS therapist_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create the post_images table for storing image URLs associated with posts
CREATE TABLE IF NOT EXISTS post_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES therapist_posts(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create the post_videos table for storing video URLs
CREATE TABLE IF NOT EXISTS post_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES therapist_posts(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create the post_tags table for storing tags associated with posts
CREATE TABLE IF NOT EXISTS post_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES therapist_posts(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(post_id, tag)
);

-- Create the post_likes table to track user likes
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES therapist_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(post_id, user_id)
);

-- Create the post_saves table to track saved posts by users
CREATE TABLE IF NOT EXISTS post_saves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES therapist_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(post_id, user_id)
);

-- Create a function to get all post details for frontend
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
    prof.specialization AS author_title,
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
    therapist_posts p
  JOIN 
    profiles prof ON p.author_id = prof.id
  LEFT JOIN 
    post_images pi ON p.id = pi.post_id
  LEFT JOIN 
    post_tags pt ON p.id = pt.post_id
  GROUP BY 
    p.id, prof.full_name, prof.avatar_url, prof.specialization
  ORDER BY 
    p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION get_post_details() TO authenticated;

-- Function to directly create a post bypassing RLS
CREATE OR REPLACE FUNCTION create_post_direct(p_content TEXT, p_author_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_post_id UUID;
BEGIN
  -- Insert the post
  INSERT INTO therapist_posts (content, author_id, likes, comments, shares)
  VALUES (p_content, p_author_id, 0, 0, 0)
  RETURNING id INTO new_post_id;
  
  RETURN new_post_id;
END;
$$;

-- Grant access to the functions
GRANT EXECUTE ON FUNCTION create_post_direct TO authenticated;

-- Stored procedures for incrementing and decrementing post likes count
CREATE OR REPLACE FUNCTION increment_post_likes(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE therapist_posts 
  SET likes = likes + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Procedure to decrement likes count
CREATE OR REPLACE FUNCTION decrement_post_likes(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE therapist_posts 
  SET likes = GREATEST(0, likes - 1) -- Prevent negative likes
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Grant access to the functions
GRANT EXECUTE ON FUNCTION increment_post_likes TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_post_likes TO authenticated;

-- Create policy for authenticated users to select from therapist_posts (disable RLS first)
ALTER TABLE therapist_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY select_therapist_posts ON therapist_posts FOR SELECT TO authenticated USING (true);

-- Create policy for authenticated users to insert posts (simplified to get working)
CREATE POLICY insert_therapist_posts ON therapist_posts FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = author_id);

-- Similar policies for related tables
ALTER TABLE post_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_saves ENABLE ROW LEVEL SECURITY;

-- Select policies for all users
CREATE POLICY select_post_images ON post_images FOR SELECT TO authenticated USING (true);
CREATE POLICY select_post_videos ON post_videos FOR SELECT TO authenticated USING (true);
CREATE POLICY select_post_tags ON post_tags FOR SELECT TO authenticated USING (true);
CREATE POLICY select_post_likes ON post_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY select_post_saves ON post_saves FOR SELECT TO authenticated USING (true);

-- Insert policies for authenticated users
CREATE POLICY insert_post_images ON post_images FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY insert_post_videos ON post_videos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY insert_post_tags ON post_tags FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY insert_post_likes ON post_likes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY insert_post_saves ON post_saves FOR INSERT TO authenticated WITH CHECK (true);

-- Insert a first post for demo purposes
INSERT INTO therapist_posts (content, author_id, likes, comments, shares)
VALUES ('This is a test post created by the SQL setup script.', auth.uid(), 0, 0, 0); 