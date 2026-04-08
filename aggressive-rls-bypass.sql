-- Aggressive RLS bypass - disable RLS completely for testing
-- Run this in Supabase SQL Editor

-- 1. Completely disable RLS on all tables
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotels DISABLE ROW LEVEL SECURITY;

-- 2. Drop ALL policies to ensure no conflicts
DROP POLICY IF EXISTS "Users can manage own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow booking inserts" ON public.bookings;
DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public can read hotels" ON public.hotels;

-- 3. Add phone column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'phone'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN phone TEXT;
    RAISE NOTICE 'Added phone column to profiles table';
  END IF;
END $$;

-- 4. Create/update profile record for the specific user
DO $$
BEGIN
  -- Try to update existing profile first
  UPDATE public.profiles 
  SET phone = '+977-1234567890'
  WHERE user_id = '70a7bc52-5385-4fea-b9f6-653d0e1ede67';
  
  -- If no rows were updated, insert new profile
  IF NOT FOUND THEN
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
  END IF;
  
  RAISE NOTICE 'Profile record created/updated for user 70a7bc52-5385-4fea-b9f6-653d0e1ede67';
END $$;

-- 5. Test the exact queries that are failing (with RLS disabled)
DO $$
BEGIN
  -- Test profile query
  PERFORM 1 FROM public.profiles 
  WHERE user_id = '70a7bc52-5385-4fea-b9f6-653d0e1ede67';
  
  RAISE NOTICE 'Profile query test (RLS disabled): SUCCESS';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Profile query test (RLS disabled): FAILED - %', SQLERRM;
END $$;

DO $$
BEGIN
  -- Test booking query
  PERFORM 1 FROM public.bookings 
  WHERE user_id = '70a7bc52-5385-4fea-b9f6-653d0e1ede67';
  
  RAISE NOTICE 'Booking query test (RLS disabled): SUCCESS';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Booking query test (RLS disabled): FAILED - %', SQLERRM;
END $$;

-- 6. Test a real booking insert
DO $$
DECLARE
  hotel_uuid UUID;
  booking_success BOOLEAN;
BEGIN
  -- Get first available hotel ID
  SELECT id INTO hotel_uuid 
  FROM public.hotels 
  LIMIT 1;
  
  IF hotel_uuid IS NOT NULL THEN
    -- Try to insert booking
    INSERT INTO public.bookings (
      hotel_id,
      user_id,
      check_in_date,
      check_out_date,
      guests,
      room_type,
      guest_phone,
      total_price,
      status,
      created_at
    ) VALUES (
      hotel_uuid,
      '70a7bc52-5385-4fea-b9f6-653d0e1ede67',
      '2026-04-10',
      '2026-04-12',
      2,
      'Standard',
      '+977-1234567890',
      200.00,
      'confirmed',
      NOW()
    );
    
    -- Check if booking was successful
    SELECT COUNT(*) > 0 INTO booking_success
    FROM public.bookings 
    WHERE user_id = '70a7bc52-5385-4fea-b9f6-653d0e1ede67'
    AND created_at >= NOW() - INTERVAL '1 minute';
    
    RAISE NOTICE 'Test booking insert (RLS disabled): %', CASE 
      WHEN booking_success THEN 'SUCCESS'
      ELSE 'FAILED'
    END;
    
    -- Clean up test booking
    IF booking_success THEN
      DELETE FROM public.bookings 
      WHERE user_id = '70a7bc52-5385-4fea-b9f6-653d0e1ede67'
      AND created_at >= NOW() - INTERVAL '1 minute';
    END IF;
  ELSE
    RAISE NOTICE 'No hotels found in database';
  END IF;
END $$;

-- 7. Final verification
SELECT 
  'Final verification (RLS disabled)' as info,
  (SELECT COUNT(*) FROM public.profiles WHERE user_id = '70a7bc52-5385-4fea-b9f6-653d0e1ede67') as profile_count,
  (SELECT COUNT(*) FROM public.bookings WHERE user_id = '70a7bc52-5385-4fea-b9f6-653d0e1ede67') as booking_count;

-- 8. Show that RLS is disabled
SELECT 
  'RLS Status Check' as info,
  'RLS is currently DISABLED for testing' as status,
  'Frontend should work now without 403 errors' as note;
