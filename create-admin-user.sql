-- Create admin user for Nepal Stays
-- Run this in Supabase SQL Editor

-- Insert admin user into auth.users with admin role
-- Note: This creates a user with email and password
-- You'll need to set the user metadata to mark them as admin

-- First, create the user in auth.users (this requires service role key)
-- For now, we'll create a profile record and you can manually create the auth user

-- Note: Skip profile creation for now
-- The profile will be created automatically when the user first logs in
-- or you can create it manually after the auth user exists with the actual UUID

-- Step 1: Create the auth user in Supabase Dashboard
-- Go to Supabase Authentication > Users > Create User
-- Email: admin@gmail.com
-- Password: admin
-- Email confirmed: Yes

-- Step 2: Set admin role for the user
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'admin@gmail.com';

-- Step 3: Create profile record (run this after creating the auth user)
-- Replace 'ACTUAL_USER_ID' with the UUID from the auth user
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get the actual user ID from auth.users
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@gmail.com' 
    LIMIT 1;
    
    IF admin_user_id IS NOT NULL THEN
        -- Check if phone column exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles' 
            AND column_name = 'phone'
            AND table_schema = 'public'
        ) THEN
            INSERT INTO public.profiles (
              user_id,
              full_name,
              email,
              phone,
              created_at
            ) VALUES (
              admin_user_id,
              'Admin User',
              'admin@gmail.com',
              '+977-9812345678',
              NOW()
            ) ON CONFLICT (user_id) DO UPDATE SET
              full_name = EXCLUDED.full_name,
              email = EXCLUDED.email,
              phone = EXCLUDED.phone;
        ELSE
            INSERT INTO public.profiles (
              user_id,
              full_name,
              email,
              created_at
            ) VALUES (
              admin_user_id,
              'Admin User',
              'admin@gmail.com',
              NOW()
            ) ON CONFLICT (user_id) DO UPDATE SET
              full_name = EXCLUDED.full_name,
              email = EXCLUDED.email;
        END IF;
        
        RAISE NOTICE 'Admin profile created successfully for user ID: %', admin_user_id;
    ELSE
        RAISE NOTICE 'Admin user not found. Please create the auth user first.';
    END IF;
END $$;

-- Admin credentials:
-- Email: admin@gmail.com
-- Password: admin
-- 4. In the user's metadata, add: {"role": "admin"}
-- 5. Or run the UPDATE statement above to set the role
