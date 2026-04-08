-- Fix RLS 403/400 permission errors blocking user data access
-- Run this in Supabase SQL Editor

-- 1. Check current RLS policies that might be causing 403 errors
SELECT 
  'Current RLS Policies' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('bookings', 'profiles', 'hotels')
ORDER BY tablename, policyname;

-- 2. Check if RLS is enabled on these tables
SELECT 
  'RLS Status' as info,
  tablename,
  rowlevelsecurity
FROM pg_tables 
WHERE tablename IN ('bookings', 'profiles', 'hotels')
AND schemaname = 'public';

-- 3. Disable RLS temporarily to fix permission issues
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotels DISABLE ROW LEVEL SECURITY;

-- 4. Drop all existing policies that might be causing conflicts
DROP POLICY IF EXISTS "Users can manage own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow booking inserts" ON public.bookings;
DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- 5. Re-enable RLS with simple, working policies
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;

-- 6. Create simple policies for bookings
CREATE POLICY "Users can manage own bookings" ON public.bookings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bookings" ON public.bookings
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 7. Create simple policies for profiles
CREATE POLICY "Users can manage own profile" ON public.profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 8. Create simple policies for hotels (public read access)
CREATE POLICY "Public can read hotels" ON public.hotels
  FOR SELECT USING (true);

-- 9. Test the specific user ID from console logs
DO $$
DECLARE
  test_user_id UUID := '70a7bc52-5385-4fea-b9f6-653d0e1ede67';
  booking_count INTEGER;
  profile_count INTEGER;
BEGIN
  -- Test bookings access
  SELECT COUNT(*) INTO booking_count
  FROM public.bookings 
  WHERE user_id = test_user_id;
  
  -- Test profiles access
  SELECT COUNT(*) INTO profile_count
  FROM public.profiles 
  WHERE user_id = test_user_id;
  
  RAISE NOTICE 'Test Results for user %:', test_user_id;
  RAISE NOTICE 'Bookings accessible: %', booking_count;
  RAISE NOTICE 'Profiles accessible: %', profile_count;
END $$;

-- 10. Final verification of policies
SELECT 
  'Final RLS Policies' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies 
WHERE tablename IN ('bookings', 'profiles', 'hotels')
ORDER BY tablename, policyname;
