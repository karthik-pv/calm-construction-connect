/* 
POST IMAGES STORAGE SETUP
Run this script in Supabase SQL Editor to create a storage bucket for post images 
and set appropriate permissions
*/

-- Check if the post_images bucket exists, and create it if it doesn't
DO $$
BEGIN
  -- Create the bucket if it doesn't exist already
  -- Note: This requires admin privileges
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

-- Allow any authenticated user to upload files to the post_images bucket
CREATE POLICY "Allow authenticated uploads to post_images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'post_images');

-- Allow any user to read from the post_images bucket
CREATE POLICY "Allow public read access to post_images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'post_images');

-- Allow file owners to update their files
CREATE POLICY "Allow owners to update their files in post_images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'post_images' AND owner = auth.uid())
WITH CHECK (bucket_id = 'post_images' AND owner = auth.uid());

-- Allow file owners to delete their files
CREATE POLICY "Allow owners to delete their files in post_images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'post_images' AND owner = auth.uid());

-- This script should be run in the Supabase SQL Editor
-- After running, make sure to create the bucket in the Supabase dashboard if this fails
-- You can manually create it at Storage > Create bucket > Name: post_images > Make public 