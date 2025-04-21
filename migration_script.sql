-- Migration script to transfer data from old tables to new ones
-- Run this after the main schema changes

-- 1. Migrate data from therapist_patient to expert_client
INSERT INTO expert_client (expert_id, client_id, created_at)
SELECT therapist_id, patient_id, created_at
FROM therapist_patient
ON CONFLICT (expert_id, client_id) DO NOTHING;

-- 2. Migrate data from therapist_posts to expert_posts
INSERT INTO expert_posts (id, author_id, content, likes, comments, shares, created_at, updated_at)
SELECT id, author_id, content, likes, comments, shares, created_at, updated_at
FROM therapist_posts
ON CONFLICT (id) DO NOTHING;

-- 3. Update the post_images, post_videos, post_tags tables to point to the new expert_posts
-- This is only needed if you're creating new tables rather than altering existing ones

-- First, backup existing data if the tables already have data
CREATE TABLE IF NOT EXISTS post_images_backup AS SELECT * FROM post_images;
CREATE TABLE IF NOT EXISTS post_videos_backup AS SELECT * FROM post_videos;
CREATE TABLE IF NOT EXISTS post_tags_backup AS SELECT * FROM post_tags;
CREATE TABLE IF NOT EXISTS post_likes_backup AS SELECT * FROM post_likes;
CREATE TABLE IF NOT EXISTS post_saves_backup AS SELECT * FROM post_saves;

-- Then migrate the data to point to expert_posts if needed
-- Only run these if you've created new tables with different references
-- INSERT INTO post_images (id, post_id, image_url, position, created_at)
-- SELECT id, post_id, image_url, position, created_at
-- FROM post_images_backup;

-- INSERT INTO post_videos (id, post_id, video_url, created_at)
-- SELECT id, post_id, video_url, created_at
-- FROM post_videos_backup;

-- INSERT INTO post_tags (id, post_id, tag, created_at)
-- SELECT id, post_id, tag, created_at
-- FROM post_tags_backup;

-- INSERT INTO post_likes (id, post_id, user_id, created_at)
-- SELECT id, post_id, user_id, created_at
-- FROM post_likes_backup;

-- INSERT INTO post_saves (id, post_id, user_id, created_at)
-- SELECT id, post_id, user_id, created_at
-- FROM post_saves_backup; 