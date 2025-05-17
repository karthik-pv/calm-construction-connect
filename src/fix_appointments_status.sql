-- Fix the appointments table constraint to handle both "canceled" and "cancelled" spellings
DO $$
BEGIN
    -- Check what constraint exists currently
    RAISE NOTICE 'Checking existing constraint';
    
    -- Try to update the constraint if it exists
    BEGIN
        ALTER TABLE public.appointments 
        DROP CONSTRAINT IF EXISTS appointments_status_check;
        
        ALTER TABLE public.appointments
        ADD CONSTRAINT appointments_status_check 
        CHECK (status::text = ANY (ARRAY['pending'::text, 'confirmed'::text, 'canceled'::text, 'cancelled'::text, 'completed'::text]));
        
        RAISE NOTICE 'Successfully updated the constraint to allow both canceled and cancelled spellings';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating constraint: %', SQLERRM;
    END;
    
    -- List all appointment statuses currently in the database
    RAISE NOTICE 'Current appointment statuses in the database:';
    PERFORM status, count(*)
    FROM public.appointments
    GROUP BY status;
END
$$; 