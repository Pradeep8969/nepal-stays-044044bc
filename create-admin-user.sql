-- Create admin user for Nepal Stays
-- Run this in Supabase SQL Editor

-- Insert admin user into auth.users with admin role
-- Note: This creates a user with email and password
-- You'll need to set the user metadata to mark them as admin

-- First, create the user in auth.users (this requires service role key)
-- For now, we'll create a profile record and you can manually create the auth user

-- Create admin profile record
INSERT INTO public.profiles (
  user_id,
  full_name,
  email,
  phone,
  created_at
) VALUES (
  'admin-user-id', -- This will be replaced with actual auth user ID
  'Admin User',
  'admin@nepalstays.com',
  '+977-9812345678',
  NOW()
) ON CONFLICT (user_id) DO NOTHING;

-- Alternative: Update existing user to be admin
-- If you already have a user, you can update their metadata to make them admin
-- Run this after creating the auth user:

UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'admin@nepalstays.com';

-- Admin credentials:
-- Email: admin@nepalstays.com
-- Password: NepalStays@2024

-- After running this SQL:
-- 1. Go to Supabase Authentication > Users
-- 2. Create a new user with email: admin@nepalstays.com
-- 3. Set password: NepalStays@2024
-- 4. In the user's metadata, add: {"role": "admin"}
-- 5. Or run the UPDATE statement above to set the role
