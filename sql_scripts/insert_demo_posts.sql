-- Insert demo data for therapist posts
-- First, let's add some posts
INSERT INTO therapist_posts (id, author_id, content, likes, comments, shares)
VALUES 
  ('00000000-0000-0000-0000-000000000001', (SELECT id FROM profiles WHERE user_role = 'therapist' LIMIT 1), 
   'Recognizing signs of burnout in construction: 

1. Exhaustion that sleep doesn''t fix
2. Increased irritability with colleagues
3. Feeling detached from your work
4. Decreased performance despite working longer hours

Burnout is a serious condition that requires attention. If you''re experiencing these symptoms, consider it a warning sign to prioritize your mental health.', 
   28, 7, 4),
  
  ('00000000-0000-0000-0000-000000000002', (SELECT id FROM profiles WHERE user_role = 'therapist' LIMIT 1 OFFSET 1), 
   'Today I want to talk about the stigma surrounding mental health in the construction industry. Many workers feel they can''t speak up about their struggles due to fear of judgment or being seen as ''weak''.

Remember: Seeking help is a sign of strength, not weakness. Your mental health is just as important as your physical safety on the job site.', 
   42, 13, 9),
  
  ('00000000-0000-0000-0000-000000000003', (SELECT id FROM profiles WHERE user_role = 'therapist' LIMIT 1), 
   'Quick breathing exercise for anxiety on the job site:

1. Find a quiet spot for 2 minutes
2. Breathe in through your nose for 4 counts
3. Hold for 2 counts
4. Exhale through your mouth for 6 counts
5. Repeat 5 times

This technique activates your parasympathetic nervous system and helps bring calm during stressful moments.', 
   36, 5, 15),
  
  ('00000000-0000-0000-0000-000000000004', (SELECT id FROM profiles WHERE user_role = 'therapist' LIMIT 1 OFFSET 1), 
   'Depression can manifest differently in men working in construction:

• Increased anger or irritability
• Risk-taking behavior
• Substance use
• Physical complaints (headaches, digestive issues)
• Withdrawal from colleagues

If you notice these signs in yourself or a colleague, it''s important to reach out for support.', 
   54, 11, 22);

-- Add tags for posts
INSERT INTO post_tags (post_id, tag)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'burnout'),
  ('00000000-0000-0000-0000-000000000001', 'construction'),
  ('00000000-0000-0000-0000-000000000001', 'mentalhealth'),
  
  ('00000000-0000-0000-0000-000000000002', 'stigma'),
  ('00000000-0000-0000-0000-000000000002', 'speakup'),
  ('00000000-0000-0000-0000-000000000002', 'constructionworkers'),
  
  ('00000000-0000-0000-0000-000000000003', 'anxiety'),
  ('00000000-0000-0000-0000-000000000003', 'breathwork'),
  ('00000000-0000-0000-0000-000000000003', 'selfcare'),
  
  ('00000000-0000-0000-0000-000000000004', 'depression'),
  ('00000000-0000-0000-0000-000000000004', 'mensinmentalhealth'),
  ('00000000-0000-0000-0000-000000000004', 'support');

-- Add images for posts
INSERT INTO post_images (post_id, image_url)
VALUES 
  ('00000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format'),
  ('00000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1541199249251-f713e6145474?w=800&auto=format');

-- Add videos for posts
INSERT INTO post_videos (post_id, video_url)
VALUES 
  ('00000000-0000-0000-0000-000000000003', 'https://player.vimeo.com/video/684312905'); 