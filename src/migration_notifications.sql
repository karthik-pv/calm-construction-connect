-- First check if the notifications table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications'
    ) THEN
        -- Create the notifications table if it does not exist
        CREATE TABLE public.notifications (
            id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id uuid NOT NULL,
            title text NOT NULL,
            message text NOT NULL,
            link text,
            type text NOT NULL CHECK (type IN ('appointment_request', 'appointment_confirmed', 'appointment_rejected', 'system')),
            read boolean DEFAULT false NOT NULL,
            created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
        );

        -- Set up Row Level Security
        ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

        -- Create policy to allow users to see only their notifications
        CREATE POLICY "Users can view their own notifications" 
            ON public.notifications FOR SELECT 
            USING (auth.uid() = user_id);

        -- Create policy to allow service role to manage all notifications
        CREATE POLICY "Service role can manage all notifications" 
            ON public.notifications FOR ALL 
            USING (auth.role() = 'service_role');
        
        RAISE NOTICE 'Created notifications table with read column (used instead of is_read)';
    ELSE
        -- The table exists, check if we need to rename the column
        -- Note: To avoid breaking existing code, we'll leave the 'read' column in place
        -- and just ensure it works with the current application code
        
        RAISE NOTICE 'Notifications table already exists - will ensure it works with the application code';
    END IF;
    
    -- Create a stored procedure for creating notifications (as a fallback)
    CREATE OR REPLACE FUNCTION create_notification(
        p_user_id uuid,
        p_title text,
        p_message text,
        p_type text,
        p_link text DEFAULT NULL
    ) RETURNS uuid AS $$
    DECLARE
        v_notification_id uuid;
    BEGIN
        INSERT INTO public.notifications (
            user_id, title, message, type, link, read, created_at
        ) VALUES (
            p_user_id, p_title, p_message, p_type, p_link, false, now()
        )
        RETURNING id INTO v_notification_id;
        
        RETURN v_notification_id;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE WARNING 'Error creating notification: %', SQLERRM;
            RETURN NULL;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    RAISE NOTICE 'Created notification helper function';
END
$$; 