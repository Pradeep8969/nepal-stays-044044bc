-- Delete all users except admin - keep admin account safe
-- Run this in Supabase SQL Editor

-- 1. First clear all user data (profiles, bookings, submissions) for non-admin users
DELETE FROM public.bookings 
WHERE user_id NOT IN (
  SELECT id FROM auth.users 
  WHERE email = 'admin@gmail.com'
);

DELETE FROM public.profiles 
WHERE user_id NOT IN (
  SELECT id FROM auth.users 
  WHERE email = 'admin@gmail.com'
);

DELETE FROM public.hotel_submissions 
WHERE submitted_by NOT IN (
  SELECT id FROM auth.users 
  WHERE email = 'admin@gmail.com'
);

-- 2. Delete all authenticated users except admin
DELETE FROM auth.users 
WHERE email != 'admin@gmail.com';

-- 3. Verification - show counts after deletion
SELECT 
  'Auth users after deletion' as info,
  COUNT(*) as count
FROM auth.users;

SELECT 
  'Admin user check' as info,
  COUNT(*) as admin_count
FROM auth.users 
WHERE email = 'admin@gmail.com';

SELECT 
  'Profiles after deletion' as info,
  COUNT(*) as count
FROM public.profiles;

SELECT 
  'Admin profile check' as info,
  COUNT(*) as admin_profile_count
FROM public.profiles 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email = 'admin@gmail.com'
);

SELECT 
  'Bookings after deletion' as info,
  COUNT(*) as count
FROM public.bookings;

SELECT 
  'Hotel submissions after deletion' as info,
  COUNT(*) as count
FROM public.hotel_submissions;

SELECT 
  'Hotels remaining' as info,
  COUNT(*) as count
FROM public.hotels;

-- 4. Final confirmation
SELECT 
  'Users deleted - admin kept' as status,
  'All regular users deleted, admin account preserved' as message;
