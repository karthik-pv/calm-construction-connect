-- SQL to update Supabase for new expert categories

-- 1. Modify the UserRole type in profiles table to include new expert types
ALTER TABLE IF EXISTS public.profiles DROP CONSTRAINT IF EXISTS profiles_user_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_user_role_check 
CHECK (user_role IN (
  'patient', 
  'therapist', 
  'relationship_expert',
  'financial_expert',
  'dating_coach',
  'health_wellness_coach'
));

-- 2. Add expertise field to allow more specific categorization
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS expertise_area TEXT[];

-- 3. Create a reference table for expertise categories and subcategories
CREATE TABLE IF NOT EXISTS public.expertise_categories (
  id SERIAL PRIMARY KEY,
  category_name TEXT NOT NULL,
  parent_category TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Insert the predefined expertise categories and subcategories
INSERT INTO expertise_categories (category_name, parent_category, description) VALUES
-- Therapist subcategories
('Anxiety', 'therapist', 'Specializes in anxiety disorders'),
('Depression', 'therapist', 'Specializes in depression and mood disorders'),
('PTSD', 'therapist', 'Specializes in post-traumatic stress disorder'),
('Addiction', 'therapist', 'Specializes in addiction recovery'),
('Grief', 'therapist', 'Specializes in grief counseling'),

-- Relationship Expert subcategories
('Conflict Resolution', 'relationship_expert', 'Conflict resolution with partners'),
('Family Bonding', 'relationship_expert', 'Strengthening bonds with children/family'),
('Communication Strategies', 'relationship_expert', 'Healthy communication strategies'),
('Emotional Stress', 'relationship_expert', 'Managing emotional stress from home life'),
('Separation Support', 'relationship_expert', 'Navigating separation or infidelity'),

-- Financial Expert subcategories
('Budget Planning', 'financial_expert', 'Budget planning & financial literacy'),
('Debt Management', 'financial_expert', 'Debt management strategies'),
('Saving Plans', 'financial_expert', 'Saving plans for long/short-term goals'),
('Credit Improvement', 'financial_expert', 'Credit score improvement'),
('Retirement Planning', 'financial_expert', 'Retirement & pension planning'),

-- Dating Coach subcategories
('Confidence Building', 'dating_coach', 'Confidence building & self-worth'),
('Online Dating', 'dating_coach', 'Online dating guidance'),
('Dating Habits', 'dating_coach', 'Healthy dating habits & red flags'),
('Post-Divorce Support', 'dating_coach', 'Post-divorce/separation support'),
('Dating Communication', 'dating_coach', 'Effective communication in dating'),

-- Health & Wellness Coach subcategories
('Fitness Plans', 'health_wellness_coach', 'Customized fitness plans'),
('Nutrition', 'health_wellness_coach', 'Nutritional guidance for energy'),
('Stress Management', 'health_wellness_coach', 'Stress management techniques'),
('Sleep Hygiene', 'health_wellness_coach', 'Sleep hygiene and recovery'),
('Substance Reduction', 'health_wellness_coach', 'Substance use reduction support');

-- 5. Create expert-client relationship table
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

-- 6. Update the post policies to include all expert types
DROP POLICY IF EXISTS "Experts can insert posts." ON public.posts;
CREATE POLICY "Experts can insert posts."
  ON public.posts FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    (SELECT user_role FROM public.profiles WHERE id = auth.uid()) IN 
    ('therapist', 'relationship_expert', 'financial_expert', 'dating_coach', 'health_wellness_coach')
  );

DROP POLICY IF EXISTS "Experts can update their own posts." ON public.posts;
CREATE POLICY "Experts can update their own posts."
  ON public.posts FOR UPDATE USING (
    auth.uid() = user_id AND
    (SELECT user_role FROM public.profiles WHERE id = auth.uid()) IN 
    ('therapist', 'relationship_expert', 'financial_expert', 'dating_coach', 'health_wellness_coach')
  );

DROP POLICY IF EXISTS "Experts can delete their own posts." ON public.posts;
CREATE POLICY "Experts can delete their own posts."
  ON public.posts FOR DELETE USING (
    auth.uid() = user_id AND
    (SELECT user_role FROM public.profiles WHERE id = auth.uid()) IN 
    ('therapist', 'relationship_expert', 'financial_expert', 'dating_coach', 'health_wellness_coach')
  );

-- 7. Create expert_posts table
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

-- Enable RLS for expert_posts
ALTER TABLE expert_posts ENABLE ROW LEVEL SECURITY;

-- Policies for expert_posts
CREATE POLICY select_expert_posts 
  ON expert_posts FOR SELECT TO authenticated 
  USING (true);

-- Now create the policy that was causing the error
DROP POLICY IF EXISTS insert_expert_posts ON expert_posts;
CREATE POLICY insert_expert_posts 
  ON expert_posts FOR INSERT TO authenticated 
  WITH CHECK (
    auth.uid() = author_id AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND 
      user_role IN ('therapist', 'relationship_expert', 'financial_expert', 'dating_coach', 'health_wellness_coach')
    )
  );

CREATE POLICY update_expert_posts 
  ON expert_posts FOR UPDATE TO authenticated 
  USING (auth.uid() = author_id);

CREATE POLICY delete_expert_posts 
  ON expert_posts FOR DELETE TO authenticated 
  USING (auth.uid() = author_id);

-- 8. Create related tables for expert_posts
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
DROP POLICY IF EXISTS select_post_images ON post_images;
CREATE POLICY select_post_images ON post_images FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS select_post_videos ON post_videos;
CREATE POLICY select_post_videos ON post_videos FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS select_post_tags ON post_tags;
CREATE POLICY select_post_tags ON post_tags FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS select_post_likes ON post_likes;
CREATE POLICY select_post_likes ON post_likes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS select_post_saves ON post_saves;
CREATE POLICY select_post_saves ON post_saves FOR SELECT TO authenticated USING (true);

-- Allow any expert to create post content
DROP POLICY IF EXISTS insert_post_images ON post_images;
CREATE POLICY insert_post_images ON post_images FOR INSERT TO authenticated 
WITH CHECK (EXISTS (
  SELECT 1 FROM expert_posts 
  WHERE id = post_id AND author_id = auth.uid()
));

DROP POLICY IF EXISTS insert_post_videos ON post_videos;
CREATE POLICY insert_post_videos ON post_videos FOR INSERT TO authenticated 
WITH CHECK (EXISTS (
  SELECT 1 FROM expert_posts 
  WHERE id = post_id AND author_id = auth.uid()
));

DROP POLICY IF EXISTS insert_post_tags ON post_tags;
CREATE POLICY insert_post_tags ON post_tags FOR INSERT TO authenticated 
WITH CHECK (EXISTS (
  SELECT 1 FROM expert_posts 
  WHERE id = post_id AND author_id = auth.uid()
));

-- Insert policies for likes and saves for any authenticated user
DROP POLICY IF EXISTS insert_post_likes ON post_likes;
CREATE POLICY insert_post_likes ON post_likes FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS insert_post_saves ON post_saves;
CREATE POLICY insert_post_saves ON post_saves FOR INSERT TO authenticated WITH CHECK (true);

-- Delete policies
DROP POLICY IF EXISTS delete_post_likes ON post_likes;
CREATE POLICY delete_post_likes ON post_likes FOR DELETE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS delete_post_saves ON post_saves;
CREATE POLICY delete_post_saves ON post_saves FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 9. Create post details function
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

-- 10. Create post like increment/decrement functions
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

-- 11. Update the function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
begin
  INSERT INTO public.profiles (id, user_role, full_name)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'user_role',
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$; 