-- Create stored procedures for incrementing and decrementing post likes count

-- Procedure to increment likes count
CREATE OR REPLACE FUNCTION increment_post_likes(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE therapist_posts 
  SET likes = likes + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Procedure to decrement likes count
CREATE OR REPLACE FUNCTION decrement_post_likes(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE therapist_posts 
  SET likes = GREATEST(0, likes - 1) -- Prevent negative likes
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Grant access to the functions 
GRANT EXECUTE ON FUNCTION increment_post_likes TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_post_likes TO authenticated; 