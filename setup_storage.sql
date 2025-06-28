-- Create post_images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('post_images', 'post_images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for post_images bucket
-- Allow authenticated users to upload images
CREATE POLICY "Allow authenticated uploads to post_images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'post_images');

-- Allow public read access to all images
CREATE POLICY "Allow public read access to post_images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'post_images');

-- Allow users to update their own files
CREATE POLICY "Allow owners to update their files in post_images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'post_images' AND owner = auth.uid())
WITH CHECK (bucket_id = 'post_images' AND owner = auth.uid());

-- Allow users to delete their own files
CREATE POLICY "Allow owners to delete their files in post_images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'post_images' AND owner = auth.uid()); 