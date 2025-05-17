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
        -- Table exists, now check if it has the correct columns
        RAISE NOTICE 'Notifications table already exists - checking columns';

        -- Check if the read column exists
        IF NOT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'notifications'
            AND column_name = 'read'
        ) THEN
            -- Add the read column if it doesn't exist
            ALTER TABLE public.notifications ADD COLUMN read boolean DEFAULT false NOT NULL;
            RAISE NOTICE 'Added missing read column to notifications table';
        ELSE
            RAISE NOTICE 'Read column already exists';
        END IF;

        -- Check if type column has the correct constraint
        BEGIN
            -- This will throw an error if there's a problem with the check constraint
            INSERT INTO public.notifications(id, user_id, title, message, type, read) 
            VALUES (
                uuid_generate_v4(), 
                '00000000-0000-0000-0000-000000000000',
                'Test notification',
                'This is a test to verify the type constraint',
                'appointment_request',
                false
            );
            
            -- Clean up the test record
            DELETE FROM public.notifications 
            WHERE user_id = '00000000-0000-0000-0000-000000000000' 
            AND title = 'Test notification';
            
            RAISE NOTICE 'Type constraint seems valid';
        EXCEPTION WHEN check_violation THEN
            -- Drop and recreate the type constraint
            BEGIN
                ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
                ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
                    CHECK (type IN ('appointment_request', 'appointment_confirmed', 'appointment_rejected', 'system'));
                RAISE NOTICE 'Fixed type constraint';
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Error fixing type constraint: %', SQLERRM;
            END;
        WHEN OTHERS THEN
            RAISE NOTICE 'Error testing type constraint: %', SQLERRM;
        END;
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

    -- List existing notifications to verify they exist
    RAISE NOTICE 'Listing existing notifications:';
    FOR r IN (SELECT id, user_id, title, created_at, read FROM notifications LIMIT 10) LOOP
        RAISE NOTICE 'ID: %, User: %, Title: %, Date: %, Read: %', 
            r.id, r.user_id, r.title, r.created_at, r.read;
    END LOOP;
END
$$; 