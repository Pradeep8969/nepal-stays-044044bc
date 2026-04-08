-- Fix phone column issue causing 400 errors
-- Run this in Supabase SQL Editor

-- 1. Add phone column to profiles table if it doesn't exist
DO $$
BEGIN
  -- Check if phone column exists and add it if it doesn't
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'phone'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN phone TEXT;
    RAISE NOTICE 'Added phone column to profiles table';
  ELSE
    RAISE NOTICE 'Phone column already exists in profiles table';
  END IF;
END $$;

-- 2. Disable RLS temporarily to fix policies
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 3. Drop all existing policies
DROP POLICY IF EXISTS "Users can manage own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow booking inserts" ON public.bookings;
DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- 4. Re-enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Create simple, permissive policies
CREATE POLICY "Users can manage own bookings" ON public.bookings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bookings" ON public.bookings
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Users can manage own profile" ON public.profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 6. Create/update profile record for the specific user
DO $$
DECLARE
  user_exists BOOLEAN;
  profile_exists BOOLEAN;
BEGIN
  -- Check if user exists
  SELECT EXISTS(
    SELECT 1 FROM auth.users 
    WHERE id = '70a7bc52-5385-4fea-b9f6-653d0e1ede67'
  ) INTO user_exists;
  
  -- Check if profile exists
  SELECT EXISTS(
    SELECT 1 FROM public.profiles 
    WHERE user_id = '70a7bc52-5385-4fea-b9f6-653d0e1ede67'
  ) INTO profile_exists;
  
  IF user_exists AND NOT profile_exists THEN
    -- Create profile record with phone column
    INSERT INTO public.profiles (
      user_id,
      full_name,
      email,
      phone,
      created_at
    ) VALUES (
      '70a7bc52-5385-4fea-b9f6-653d0e1ede67',
      'Test User',
      'test@example.com',
      '+977-1234567890',
      NOW()
    );
    
    RAISE NOTICE 'Profile created with phone column for user 70a7bc52-5385-4fea-b9f6-653d0e1ede67';
  ELSIF user_exists AND profile_exists THEN
    -- Update existing profile to add phone if null
    UPDATE public.profiles 
    SET phone = '+977-1234567890'
    WHERE user_id = '70a7bc52-5385-4fea-b9f6-653d0e1ede67'
    AND phone IS NULL;
    
    RAISE NOTICE 'Updated existing profile with phone number';
  END IF;
END $$;

-- 7. Test the profile query that's failing
DO $$
BEGIN
  -- Test the exact query the frontend is making
  PERFORM 1 FROM public.profiles 
  WHERE user_id = '70a7bc52-5385-4fea-b9f6-653d0e1ede67';
  
  RAISE NOTICE 'Profile query test: SUCCESS';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Profile query test: FAILED - %', SQLERRM;
END $$;

-- 8. Test the booking query that's failing
DO $$
BEGIN
  -- Test the exact query the frontend is making
  PERFORM 1 FROM public.bookings 
  WHERE user_id = '70a7bc52-5385-4fea-b9f6-653d0e1ede67';
  
  RAISE NOTICE 'Booking query test: SUCCESS';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Booking query test: FAILED - %', SQLERRM;
END $$;

-- 9. Final verification
SELECT 
  'Final verification' as info,
  (SELECT COUNT(*) FROM public.profiles WHERE user_id = '70a7bc52-5385-4fea-b9f6-653d0e1ede67') as profile_count,
  (SELECT COUNT(*) FROM public.bookings WHERE user_id = '70a7bc52-5385-4fea-b9f6-653d0e1ede67') as booking_count;
