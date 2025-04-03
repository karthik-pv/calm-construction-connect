-- Create the therapist_posts table
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
  position INTEGER DEFAULT 0, -- To maintain order of multiple images
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