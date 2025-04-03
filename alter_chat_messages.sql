-- Add read column to chat_messages table
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE;
