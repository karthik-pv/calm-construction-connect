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

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION create_post_direct TO authenticated; 