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