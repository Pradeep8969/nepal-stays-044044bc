-- Add profile photo column to profiles table
-- Run this in Supabase SQL Editor

-- Add profile_photo column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN profile_photo TEXT;

-- Add profile_photo column to auth.users metadata (optional backup)
-- This will store the photo URL in user metadata as well
-- Note: This is handled automatically by the application
