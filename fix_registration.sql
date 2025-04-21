-- SQL script to fix the expert registration issue
-- This script will update the handle_new_user function to correctly set user_role

-- First, let's check the current function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create a new version of the function that properly handles user roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
begin
  -- Log the raw data for debugging
  RAISE LOG 'Creating new user profile with metadata: %', new.raw_user_meta_data;
  
  -- Extract the role from metadata with proper validation and fallback
  DECLARE
    selected_role TEXT;
  BEGIN
    -- Get the role from metadata
    selected_role := new.raw_user_meta_data ->> 'user_role';
    
    -- Validate that the role is one of the allowed values
    IF selected_role IS NULL OR selected_role NOT IN ('patient', 'therapist', 'relationship_expert', 'financial_expert', 'dating_coach', 'health_wellness_coach') THEN
      -- Default to 'patient' if invalid role
      selected_role := 'patient';
      RAISE LOG 'Invalid or missing user_role in metadata, defaulting to: %', selected_role;
    END IF;
    
    -- Log the selected role
    RAISE LOG 'Selected role for new profile: %', selected_role;
    
    -- Insert the profile with the correct role
    INSERT INTO public.profiles (
      id, 
      user_role, 
      full_name,
      status,
      updated_at
    )
    VALUES (
      new.id,
      selected_role,
      new.raw_user_meta_data ->> 'full_name',
      'active',
      now()
    );
    
    RETURN new;
  END;
end;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Add a function to help fix existing users if needed
CREATE OR REPLACE FUNCTION fix_expert_role(user_id UUID, correct_role TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles 
  SET user_role = correct_role
  WHERE id = user_id 
    AND user_role = 'therapist'
    AND correct_role IN ('therapist', 'relationship_expert', 'financial_expert', 'dating_coach', 'health_wellness_coach');
END;
$$ LANGUAGE plpgsql; 