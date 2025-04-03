# Posts System Setup Guide

This guide will help you set up the posts system for your application.

## Overview

The posts system allows therapists to create, edit, and delete posts. Users can like and save posts.

## Step 1: Set Up Database Tables and Functions

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `sql_scripts/emergency_fix.sql`
4. Run the script to create all necessary tables and functions
5. If you see any errors, please address them one by one

## Step 2: Set Up Storage for Images

1. In the Supabase dashboard, go to the SQL Editor
2. Copy and paste the contents of `sql_scripts/storage_setup.sql`
3. Run the script to set up storage policies
4. Go to Storage in the Supabase dashboard
5. Create a new bucket named "post_images" if it doesn't exist already
6. Make sure the bucket is set to public

## Step 3: Verify the Setup

1. Go to the Tables section in Supabase
2. You should see the following tables:
   - `therapist_posts`
   - `post_images`
   - `post_tags`
   - `post_likes`
   - `post_saves`
3. Go to the Storage section
4. Verify that the "post_images" bucket exists

## Step 4: Using the Posts System

### Creating Posts
- Use the "Create New Post" button in the Posts page
- Add content, tags (comma-separated), and images
- Click "Create Post"

### Editing Posts
- Click the three dots menu on your post
- Select "Edit"
- Make your changes
- Click "Save"

### Deleting Posts
- Click the three dots menu on your post
- Select "Delete"
- Confirm deletion

### Liking and Saving Posts
- Click the heart icon to like a post
- Click the bookmark icon to save a post

## Troubleshooting

If you encounter any issues:

1. Check the browser console for errors
2. Make sure all the SQL scripts ran successfully
3. Verify that your Supabase API keys are correct in the application
4. Ensure you're properly authenticated in the application

For image upload issues:
1. Ensure the "post_images" bucket exists and is public
2. Check that the storage policies are correctly set up
3. Verify that your authenticated user has permission to upload files 