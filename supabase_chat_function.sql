-- Function to get unique chat partners
CREATE OR REPLACE FUNCTION get_chat_partners(current_user_id UUID)
RETURNS TABLE (partner_id UUID)
LANGUAGE SQL
AS $$
  SELECT DISTINCT CASE WHEN sender_id = current_user_id THEN receiver_id ELSE sender_id END AS partner_id FROM chat_messages WHERE sender_id = current_user_id OR receiver_id = current_user_id;
$$;
