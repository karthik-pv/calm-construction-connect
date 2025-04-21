
-- Add new fields to the profiles table
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_name TEXT;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_phone TEXT;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS title TEXT;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS education TEXT;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS certifications TEXT;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS languages TEXT;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS appointment_fee TEXT;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS session_duration TEXT;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
-- Enable storage policies for the user-content bucket

-- Allow users to upload their own avatar files
-- CREATE POLICY "Users can upload their own avatars" 
-- ON storage.objects FOR INSERT 
-- TO authenticated 
-- WITH CHECK (
--   bucket_id = 'user-content' AND 
--   (storage.foldername(name))[1] = 'avatars' AND
--   auth.uid()::text = (storage.foldername(name))[2]
-- );

-- -- Allow users to select/view their own avatar files
-- CREATE POLICY "Users can view their own avatars" 
-- ON storage.objects FOR SELECT 
-- TO authenticated 
-- USING (
--   bucket_id = 'user-content' AND 
--   (storage.foldername(name))[1] = 'avatars'
-- );

-- -- Allow users to update their own avatar files
-- CREATE POLICY "Users can update their own avatars" 
-- ON storage.objects FOR UPDATE 
-- TO authenticated 
-- USING (
--   bucket_id = 'user-content' AND 
--   (storage.foldername(name))[1] = 'avatars' AND
--   auth.uid()::text = (storage.foldername(name))[2]
-- );

-- -- Allow users to delete their own avatar files
-- CREATE POLICY "Users can delete their own avatars" 
-- ON storage.objects FOR DELETE 
-- TO authenticated 
-- USING (
--   bucket_id = 'user-content' AND 
--   (storage.foldername(name))[1] = 'avatars' AND
--   auth.uid()::text = (storage.foldername(name))[2]
-- );

-- -- Simpler alternative: Allow all authenticated users to perform any action on the user-content bucket
-- -- Use this if the above policies are too restrictive for your use case
-- CREATE POLICY "Allow authenticated users full access to user-content bucket" 
-- ON storage.objects FOR ALL 
-- TO authenticated 
-- USING (bucket_id = 'user-content')
-- WITH CHECK (bucket_id = 'user-content');

-- -- Add new fields to the profiles table
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_name TEXT;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_phone TEXT;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS title TEXT;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS education TEXT;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS certifications TEXT;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS languages TEXT;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS appointment_fee TEXT;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS session_duration TEXT;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;



-- Function to get unique chat partners
-- CREATE OR REPLACE FUNCTION get_chat_partners(current_user_id UUID)
-- RETURNS TABLE (partner_id UUID)
-- LANGUAGE SQL
-- AS $$
--   SELECT DISTINCT CASE WHEN sender_id = current_user_id THEN receiver_id ELSE sender_id END AS partner_id FROM chat_messages WHERE sender_id = current_user_id OR receiver_id = current_user_id;
-- $$;


-- ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE;
-- -- ========== REALTIME SETUP ==========
-- -- Enable Realtime for tables (if not already done)
-- begin;
--   drop publication if exists supabase_realtime;
--   create publication supabase_realtime;
-- commit;

-- -- ========== PROFILES TABLE ==========
-- -- Create Profiles table for user metadata (if not already done)
-- create table if not exists public.profiles (
--   id uuid references auth.users on delete cascade not null primary key,
--   updated_at timestamp with time zone,
--   username text unique,
--   full_name text,
--   avatar_url text,
--   website text,
--   user_role text check (user_role in ('patient', 'therapist')) not null,
--   specialization text, -- Therapist specific
--   experience_years integer, -- Therapist specific
--   bio text, -- Therapist specific bio
--   status text check (status in ('active', 'inactive', 'pending_approval')) default 'active', -- Therapist status
--   phone_number text, -- Added phone number
--   company_name text, -- Added company name

--   constraint username_length check (char_length(username) >= 3)
-- );

-- -- Set up Row Level Security (RLS) for profiles (if not already done)
-- alter table public.profiles enable row level security;

-- -- Policies for Profiles (Ensure these are applied)
-- drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
-- create policy "Public profiles are viewable by everyone."
--   on public.profiles for select using (true);

-- drop policy if exists "Users can insert their own profile." on public.profiles;
-- create policy "Users can insert their own profile."
--   on public.profiles for insert with check (auth.uid() = id);

-- drop policy if exists "Users can update own profile." on public.profiles;
-- create policy "Users can update own profile."
--   on public.profiles for update using (auth.uid() = id);

-- -- Function to handle new user creation and profile setup (if not already done)
-- -- Modified to include full_name from metadata
-- create or replace function public.handle_new_user()
-- returns trigger
-- language plpgsql
-- security definer set search_path = public
-- as $$
-- begin
--   insert into public.profiles (id, user_role, full_name)
--   values (
--     new.id,
--     new.raw_user_meta_data ->> 'user_role',
--     new.raw_user_meta_data ->> 'full_name' -- Get full_name from metadata
--   );
--   return new;
-- end;
-- $$;

-- -- Trigger to automatically create a profile (if not already done)
-- drop trigger if exists on_auth_user_created on auth.users;
-- create trigger on_auth_user_created
--   after insert on auth.users
--   for each row execute procedure public.handle_new_user();

-- -- Add profiles table to realtime publication (if not already done)
-- alter publication supabase_realtime add table public.profiles;

-- -- ========== POSTS TABLE ==========
-- -- Create Posts table (if not already done)
-- create table if not exists public.posts (
--   id bigint generated by default as identity primary key,
--   user_id uuid references public.profiles not null,
--   title text not null,
--   content text not null,
--   created_at timestamp with time zone default timezone('utc'::text, now()) not null,
--   image_url text -- Optional image URL for posts
-- );

-- -- Enable RLS for posts (if not already done)
-- alter table public.posts enable row level security;

-- -- Policies for Posts (Ensure these are applied)
-- drop policy if exists "Posts are viewable by everyone." on public.posts;
-- create policy "Posts are viewable by everyone."
--   on public.posts for select using (true);

-- drop policy if exists "Therapists can insert posts." on public.posts;
-- create policy "Therapists can insert posts."
--   on public.posts for insert with check (
--     auth.uid() = user_id and
--     (select user_role from public.profiles where id = auth.uid()) = 'therapist'
--   );

-- drop policy if exists "Therapists can update their own posts." on public.posts;
-- create policy "Therapists can update their own posts."
--   on public.posts for update using (
--     auth.uid() = user_id and
--     (select user_role from public.profiles where id = auth.uid()) = 'therapist'
--   );

-- drop policy if exists "Therapists can delete their own posts." on public.posts;
-- create policy "Therapists can delete their own posts."
--   on public.posts for delete using (
--     auth.uid() = user_id and
--     (select user_role from public.profiles where id = auth.uid()) = 'therapist'
--   );

-- -- Add posts table to realtime publication (if not already done)
-- alter publication supabase_realtime add table public.posts;

-- -- ========== CHAT MESSAGES TABLE ==========
-- -- Create Chat Messages table (if not already done)
-- create table if not exists public.chat_messages (
--     id bigint generated by default as identity primary key,
--     sender_id uuid references public.profiles not null,
--     receiver_id uuid references public.profiles not null,
--     content text not null,
--     created_at timestamp with time zone default timezone('utc'::text, now()) not null,
--     attachment_url text -- Optional URL for chat attachments
-- );

-- -- Enable RLS for chat messages (if not already done)
-- alter table public.chat_messages enable row level security;

-- -- Policies for Chat Messages (Ensure these are applied)
-- drop policy if exists "Users can view messages they sent or received." on public.chat_messages;
-- create policy "Users can view messages they sent or received."
--   on public.chat_messages for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- drop policy if exists "Users can insert messages they send." on public.chat_messages;
-- create policy "Users can insert messages they send."
--   on public.chat_messages for insert with check (auth.uid() = sender_id);

-- -- Add chat_messages table to realtime publication (if not already done)
-- alter publication supabase_realtime add table public.chat_messages;

-- -- ========== THERAPIST-PATIENT RELATIONSHIP TABLE ==========
-- -- Create Therapist-Patient relationships table (if not already done)
-- create table if not exists public.therapist_patient (
--   therapist_id uuid references public.profiles(id) on delete cascade not null,
--   patient_id uuid references public.profiles(id) on delete cascade not null,
--   created_at timestamp with time zone default timezone('utc'::text, now()) not null,
--   primary key (therapist_id, patient_id)
-- );

-- -- Enable RLS for therapist_patient (if not already done)
-- alter table public.therapist_patient enable row level security;

-- -- Policies for Therapist-Patient (Ensure these are applied)
-- drop policy if exists "Therapists/Patients can view their own connections." on public.therapist_patient;
-- create policy "Therapists/Patients can view their own connections."
--  on public.therapist_patient for select using (auth.uid() = therapist_id or auth.uid() = patient_id);

-- drop policy if exists "Therapists/Patients can create connections." on public.therapist_patient;
-- create policy "Therapists/Patients can create connections."
--  on public.therapist_patient for insert with check (auth.uid() = therapist_id or auth.uid() = patient_id);

--  -- Optional: Add policy for deleting connections if needed
--  drop policy if exists "Therapists/Patients can delete their own connections." on public.therapist_patient;
--  create policy "Therapists/Patients can delete their own connections."
--   on public.therapist_patient for delete using (auth.uid() = therapist_id or auth.uid() = patient_id);


-- -- Add therapist_patient table to realtime publication (if not already done)
-- alter publication supabase_realtime add table public.therapist_patient;


-- -- ========== CHATBOT MESSAGES TABLE (NEW) ==========
-- create table if not exists public.chatbot_messages (
--     id bigint generated by default as identity primary key,
--     user_id uuid references public.profiles not null,
--     user_message text not null,
--     bot_response text, -- Can be null initially
--     created_at timestamp with time zone default timezone('utc'::text, now()) not null
-- );

-- -- Enable RLS for chatbot messages
-- alter table public.chatbot_messages enable row level security;

-- -- Policies for Chatbot Messages
-- create policy "Users can view their own chatbot messages."
--   on public.chatbot_messages for select using (auth.uid() = user_id);

-- create policy "Users can insert their own chatbot messages."
--   on public.chatbot_messages for insert with check (auth.uid() = user_id);

-- -- Note: Updating bot_response might need different permissions, potentially via an Edge Function

-- -- Add chatbot_messages table to realtime publication
-- alter publication supabase_realtime add table public.chatbot_messages;

-- -- ========== ANXIETY CALMER SESSIONS TABLE (NEW) ==========
-- create table if not exists public.anxiety_calmer_sessions (
--     id bigint generated by default as identity primary key,
--     user_id uuid references public.profiles not null,
--     session_type text not null, -- e.g., 'breathing', 'meditation', 'grounding'
--     duration_seconds integer,
--     started_at timestamp with time zone default timezone('utc'::text, now()) not null,
--     completed_at timestamp with time zone
-- );

-- -- Enable RLS for anxiety calmer sessions
-- alter table public.anxiety_calmer_sessions enable row level security;

-- -- Policies for Anxiety Calmer Sessions
-- create policy "Users can manage their own anxiety calmer sessions."
--   on public.anxiety_calmer_sessions for all using (auth.uid() = user_id);

-- -- Add anxiety_calmer_sessions table to realtime publication
-- alter publication supabase_realtime add table public.anxiety_calmer_sessions;


-- Create the 'post_images' bucket (Public)
-- insert into storage.buckets (id, name, public)
-- values ('post_images', 'post_images', true)
-- on conflict (id) do nothing; -- Avoid error if already exists

-- RLS Policies for 'post_images' bucket
-- Allow public read access for images
-- drop policy if exists "Post images are publicly accessible." on storage.objects;
-- create policy "Post images are publicly accessible."
--   on storage.objects for select
--   using ( bucket_id = 'post_images' );

-- -- Allow therapists to upload post images
-- drop policy if exists "Therapists can upload post images." on storage.objects;
-- create policy "Therapists can upload post images."
--   on storage.objects for insert
--   with check (
--     bucket_id = 'post_images' and
--     auth.role() = 'authenticated' and -- Ensure user is logged in
--     (select user_role from public.profiles where id = auth.uid()) = 'therapist'
--   );

-- -- Allow therapists to update their own post images
-- drop policy if exists "Therapists can update own post images." on storage.objects;
-- create policy "Therapists can update own post images."
--   on storage.objects for update
--   using (
--     auth.uid() = owner and
--     bucket_id = 'post_images' and
--     (select user_role from public.profiles where id = auth.uid()) = 'therapist'
--   )
--   with check ( bucket_id = 'post_images' );

-- -- Allow therapists to delete their own post images
-- drop policy if exists "Therapists can delete own post images." on storage.objects;
-- create policy "Therapists can delete own post images."
--   on storage.objects for delete
--   using (
--     auth.uid() = owner and
--     bucket_id = 'post_images' and
--     (select user_role from public.profiles where id = auth.uid()) = 'therapist'
--   );

-- Create the therapist_posts table
-- CREATE TABLE IF NOT EXISTS therapist_posts (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   author_id UUID NOT NULL REFERENCES profiles(id),
--   content TEXT NOT NULL,
--   likes INTEGER DEFAULT 0,
--   comments INTEGER DEFAULT 0,
--   shares INTEGER DEFAULT 0,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
-- );

-- -- Create the post_images table for storing image URLs associated with posts
-- CREATE TABLE IF NOT EXISTS post_images (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   post_id UUID NOT NULL REFERENCES therapist_posts(id) ON DELETE CASCADE,
--   image_url TEXT NOT NULL,
--   position INTEGER DEFAULT 0, -- To maintain order of multiple images
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
-- );

-- -- Create the post_videos table for storing video URLs
-- CREATE TABLE IF NOT EXISTS post_videos (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   post_id UUID NOT NULL REFERENCES therapist_posts(id) ON DELETE CASCADE,
--   video_url TEXT NOT NULL,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
-- );

-- -- Create the post_tags table for storing tags associated with posts
-- CREATE TABLE IF NOT EXISTS post_tags (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   post_id UUID NOT NULL REFERENCES therapist_posts(id) ON DELETE CASCADE,
--   tag TEXT NOT NULL,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
--   UNIQUE(post_id, tag)
-- );

-- -- Create the post_likes table to track user likes
-- CREATE TABLE IF NOT EXISTS post_likes (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   post_id UUID NOT NULL REFERENCES therapist_posts(id) ON DELETE CASCADE,
--   user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
--   UNIQUE(post_id, user_id)
-- );

-- -- Create the post_saves table to track saved posts by users
-- CREATE TABLE IF NOT EXISTS post_saves (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   post_id UUID NOT NULL REFERENCES therapist_posts(id) ON DELETE CASCADE,
--   user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
--   UNIQUE(post_id, user_id)
-- ); 

-- Insert demo data for therapist posts
-- First, let's add some posts
-- INSERT INTO therapist_posts (id, author_id, content, likes, comments, shares)
-- VALUES 
--   ('00000000-0000-0000-0000-000000000001', (SELECT id FROM profiles WHERE user_role = 'therapist' LIMIT 1), 
--    'Recognizing signs of burnout in construction: 

-- 1. Exhaustion that sleep doesn''t fix
-- 2. Increased irritability with colleagues
-- 3. Feeling detached from your work
-- 4. Decreased performance despite working longer hours

-- Burnout is a serious condition that requires attention. If you''re experiencing these symptoms, consider it a warning sign to prioritize your mental health.', 
--    28, 7, 4),
  
--   ('00000000-0000-0000-0000-000000000002', (SELECT id FROM profiles WHERE user_role = 'therapist' LIMIT 1 OFFSET 1), 
--    'Today I want to talk about the stigma surrounding mental health in the construction industry. Many workers feel they can''t speak up about their struggles due to fear of judgment or being seen as ''weak''.

-- Remember: Seeking help is a sign of strength, not weakness. Your mental health is just as important as your physical safety on the job site.', 
--    42, 13, 9),
  
--   ('00000000-0000-0000-0000-000000000003', (SELECT id FROM profiles WHERE user_role = 'therapist' LIMIT 1), 
--    'Quick breathing exercise for anxiety on the job site:

-- 1. Find a quiet spot for 2 minutes
-- 2. Breathe in through your nose for 4 counts
-- 3. Hold for 2 counts
-- 4. Exhale through your mouth for 6 counts
-- 5. Repeat 5 times

-- This technique activates your parasympathetic nervous system and helps bring calm during stressful moments.', 
--    36, 5, 15),
  
--   ('00000000-0000-0000-0000-000000000004', (SELECT id FROM profiles WHERE user_role = 'therapist' LIMIT 1 OFFSET 1), 
--    'Depression can manifest differently in men working in construction:

-- • Increased anger or irritability
-- • Risk-taking behavior
-- • Substance use
-- • Physical complaints (headaches, digestive issues)
-- • Withdrawal from colleagues

-- If you notice these signs in yourself or a colleague, it''s important to reach out for support.', 
--    54, 11, 22);

-- -- Add tags for posts
-- INSERT INTO post_tags (post_id, tag)
-- VALUES 
--   ('00000000-0000-0000-0000-000000000001', 'burnout'),
--   ('00000000-0000-0000-0000-000000000001', 'construction'),
--   ('00000000-0000-0000-0000-000000000001', 'mentalhealth'),
  
--   ('00000000-0000-0000-0000-000000000002', 'stigma'),
--   ('00000000-0000-0000-0000-000000000002', 'speakup'),
--   ('00000000-0000-0000-0000-000000000002', 'constructionworkers'),
  
--   ('00000000-0000-0000-0000-000000000003', 'anxiety'),
--   ('00000000-0000-0000-0000-000000000003', 'breathwork'),
--   ('00000000-0000-0000-0000-000000000003', 'selfcare'),
  
--   ('00000000-0000-0000-0000-000000000004', 'depression'),
--   ('00000000-0000-0000-0000-000000000004', 'mensinmentalhealth'),
--   ('00000000-0000-0000-0000-000000000004', 'support');

-- -- Add images for posts
-- INSERT INTO post_images (post_id, image_url)
-- VALUES 
--   ('00000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format'),
--   ('00000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1541199249251-f713e6145474?w=800&auto=format');

-- -- Add videos for posts
-- INSERT INTO post_videos (post_id, video_url)
-- VALUES 
--   ('00000000-0000-0000-0000-000000000003', 'https://player.vimeo.com/video/684312905'); 
-- Create a function to get all post details for frontend
-- CREATE OR REPLACE FUNCTION get_post_details()
-- RETURNS TABLE (
--   id UUID,
--   author_id UUID,
--   author_name TEXT,
--   author_avatar TEXT,
--   author_title TEXT,
--   content TEXT,
--   images TEXT[],
--   video TEXT,
--   tags TEXT[],
--   likes_count INTEGER,
--   comments_count INTEGER,
--   shares_count INTEGER,
--   created_at TIMESTAMP WITH TIME ZONE,
--   liked BOOLEAN,
--   saved BOOLEAN
-- ) AS $$
-- DECLARE
--   current_user_id UUID := auth.uid();
-- BEGIN
--   RETURN QUERY
--   SELECT 
--     p.id,
--     p.author_id,
--     prof.full_name AS author_name,
--     prof.avatar_url AS author_avatar,
--     prof.specialization AS author_title,
--     p.content,
--     COALESCE(ARRAY_AGG(DISTINCT pi.image_url) FILTER (WHERE pi.image_url IS NOT NULL), '{}') AS images,
--     (SELECT pv.video_url FROM post_videos pv WHERE pv.post_id = p.id LIMIT 1) AS video,
--     COALESCE(ARRAY_AGG(DISTINCT pt.tag) FILTER (WHERE pt.tag IS NOT NULL), '{}') AS tags,
--     p.likes AS likes_count,
--     p.comments AS comments_count,
--     p.shares AS shares_count,
--     p.created_at,
--     (SELECT EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = current_user_id)) AS liked,
--     (SELECT EXISTS(SELECT 1 FROM post_saves ps WHERE ps.post_id = p.id AND ps.user_id = current_user_id)) AS saved
--   FROM 
--     therapist_posts p
--   JOIN 
--     profiles prof ON p.author_id = prof.id
--   LEFT JOIN 
--     post_images pi ON p.id = pi.post_id
--   LEFT JOIN 
--     post_tags pt ON p.id = pt.post_id
--   GROUP BY 
--     p.id, prof.full_name, prof.avatar_url, prof.specialization
--   ORDER BY 
--     p.created_at DESC;
-- END;
-- $$ LANGUAGE plpgsql;

-- -- Grant access to the function
-- GRANT EXECUTE ON FUNCTION get_post_details() TO authenticated; 


-- -- Create policy for authenticated users to select from therapist_posts
-- ALTER TABLE therapist_posts ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY select_therapist_posts ON therapist_posts FOR SELECT TO authenticated USING (true);

-- -- Create policy for therapists to insert their own posts
-- CREATE POLICY insert_therapist_posts ON therapist_posts FOR INSERT TO authenticated 
-- WITH CHECK (auth.uid() = author_id AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_role = 'therapist'));

-- -- Create policy for therapists to update/delete their own posts
-- CREATE POLICY update_therapist_posts ON therapist_posts FOR UPDATE TO authenticated 
-- USING (auth.uid() = author_id);

-- CREATE POLICY delete_therapist_posts ON therapist_posts FOR DELETE TO authenticated 
-- USING (auth.uid() = author_id);

-- -- Similar policies for related tables
-- ALTER TABLE post_images ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE post_videos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE post_saves ENABLE ROW LEVEL SECURITY;

-- -- Select policies for all users
-- CREATE POLICY select_post_images ON post_images FOR SELECT TO authenticated USING (true);
-- CREATE POLICY select_post_videos ON post_videos FOR SELECT TO authenticated USING (true);
-- CREATE POLICY select_post_tags ON post_tags FOR SELECT TO authenticated USING (true);
-- CREATE POLICY select_post_likes ON post_likes FOR SELECT TO authenticated USING (true);
-- CREATE POLICY select_post_saves ON post_saves FOR SELECT TO authenticated USING (true);

-- -- Insert policies for therapists on their posts
-- CREATE POLICY insert_post_images ON post_images FOR INSERT TO authenticated 
-- WITH CHECK (EXISTS (SELECT 1 FROM therapist_posts WHERE id = post_id AND author_id = auth.uid()));

-- CREATE POLICY insert_post_videos ON post_videos FOR INSERT TO authenticated 
-- WITH CHECK (EXISTS (SELECT 1 FROM therapist_posts WHERE id = post_id AND author_id = auth.uid()));

-- CREATE POLICY insert_post_tags ON post_tags FOR INSERT TO authenticated 
-- WITH CHECK (EXISTS (SELECT 1 FROM therapist_posts WHERE id = post_id AND author_id = auth.uid()));

-- -- Insert policies for likes and saves for any authenticated user
-- CREATE POLICY insert_post_likes ON post_likes FOR INSERT TO authenticated WITH CHECK (true);
-- CREATE POLICY insert_post_saves ON post_saves FOR INSERT TO authenticated WITH CHECK (true);

-- -- Update and delete policies
-- CREATE POLICY delete_post_likes ON post_likes FOR DELETE TO authenticated USING (user_id = auth.uid());
-- CREATE POLICY delete_post_saves ON post_saves FOR DELETE TO authenticated USING (user_id = auth.uid()); 


-- Create stored procedures for incrementing and decrementing post likes count

-- Procedure to increment likes count
-- CREATE OR REPLACE FUNCTION increment_post_likes(post_id UUID)
-- RETURNS VOID AS $$
-- BEGIN
--   UPDATE therapist_posts 
--   SET likes = likes + 1
--   WHERE id = post_id;
-- END;
-- $$ LANGUAGE plpgsql;

-- -- Procedure to decrement likes count
-- CREATE OR REPLACE FUNCTION decrement_post_likes(post_id UUID)
-- RETURNS VOID AS $$
-- BEGIN
--   UPDATE therapist_posts 
--   SET likes = GREATEST(0, likes - 1) -- Prevent negative likes
--   WHERE id = post_id;
-- END;
-- $$ LANGUAGE plpgsql;

-- -- Grant access to the functions 
-- GRANT EXECUTE ON FUNCTION increment_post_likes TO authenticated;
-- GRANT EXECUTE ON FUNCTION decrement_post_likes TO authenticated; 

  --  CREATE POLICY insert_therapist_posts ON therapist_posts FOR INSERT TO authenticated 
  --  WITH CHECK (auth.uid() = author_id AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_role = 'therapist'));

  -- Create policy for therapists to insert their own posts
-- CREATE POLICY insert_therapist_posts ON therapist_posts FOR INSERT TO authenticated 
-- WITH CHECK (auth.uid() = author_id AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_role = 'therapist'));

/* 
POST IMAGES STORAGE SETUP
Run this script in Supabase SQL Editor to create a storage bucket for post images 
and set appropriate permissions
*/

-- Check if the post_images bucket exists, and create it if it doesn't
-- DO $$
-- BEGIN
--   -- Create the bucket if it doesn't exist already
--   -- Note: This requires admin privileges
--   IF NOT EXISTS (
--     SELECT 1 FROM storage.buckets WHERE name = 'post_images'
--   ) THEN
--     INSERT INTO storage.buckets (id, name, public)
--     VALUES ('post_images', 'post_images', true);
    
--     -- Ensure the bucket is publicly accessible for viewing images
--     UPDATE storage.buckets
--     SET public = true
--     WHERE name = 'post_images';
--   END IF;
-- END $$;

-- -- Allow any authenticated user to upload files to the post_images bucket
-- CREATE POLICY "Allow authenticated uploads to post_images"
-- ON storage.objects
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (bucket_id = 'post_images');

-- -- Allow any user to read from the post_images bucket
-- CREATE POLICY "Allow public read access to post_images"
-- ON storage.objects
-- FOR SELECT
-- TO public
-- USING (bucket_id = 'post_images');

-- -- Allow file owners to update their files
-- CREATE POLICY "Allow owners to update their files in post_images"
-- ON storage.objects
-- FOR UPDATE
-- TO authenticated
-- USING (bucket_id = 'post_images' AND owner = auth.uid())
-- WITH CHECK (bucket_id = 'post_images' AND owner = auth.uid());

-- -- Allow file owners to delete their files
-- CREATE POLICY "Allow owners to delete their files in post_images"
-- ON storage.objects
-- FOR DELETE
-- TO authenticated
-- USING (bucket_id = 'post_images' AND owner = auth.uid());

-- -- This script should be run in the Supabase SQL Editor
-- -- After running, make sure to create the bucket in the Supabase dashboard if this fails
-- -- You can manually create it at Storage > Create bucket > Name: post_images > Make public