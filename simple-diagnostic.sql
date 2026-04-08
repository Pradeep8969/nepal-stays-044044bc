-- Simple diagnostic - avoid all schema queries
-- Run this in Supabase SQL Editor

-- 1. Check if the user exists in auth.users
SELECT 
  'User in auth.users' as info,
  id,
  email,
  created_at,
  raw_user_meta_data
FROM auth.users 
WHERE id = '70a7bc52-5385-4fea-b9f6-653d0e1ede67';

-- 2. Check if the user has a profile record (basic columns only)
SELECT 
  'User profile record' as info,
  user_id,
  full_name,
  email,
  created_at
FROM public.profiles 
WHERE user_id = '70a7bc52-5385-4fea-b9f6-653d0e1ede67';

-- 3. Check if the user has any bookings
SELECT 
  'User bookings' as info,
  id,
  hotel_id,
  user_id,
  check_in_date,
  check_out_date,
  status,
  created_at
FROM public.bookings 
WHERE user_id = '70a7bc52-5385-4fea-b9f6-653d0e1ede67';

-- 4. Create a profile record if it doesn't exist
DO $$
DECLARE
  user_exists BOOLEAN;
  profile_exists BOOLEAN;
BEGIN
  -- Check if user exists in auth.users
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
    -- Create profile record with basic columns
    INSERT INTO public.profiles (
      user_id,
      full_name,
      email,
      created_at
    ) VALUES (
      '70a7bc52-5385-4fea-b9f6-653d0e1ede67',
      'Test User',
      'test@example.com',
      NOW()
    );
    
    RAISE NOTICE 'Profile created for user 70a7bc52-5385-4fea-b9f6-653d0e1ede67';
  ELSE
    RAISE NOTICE 'User exists: %, Profile exists: %', user_exists, profile_exists;
  END IF;
END $$;

-- 5. Test a simple booking insert
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
    
    RAISE NOTICE 'Test booking insert: %', CASE 
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

-- 6. Final verification
SELECT 
  'Final verification' as info,
  (SELECT COUNT(*) FROM public.profiles WHERE user_id = '70a7bc52-5385-4fea-b9f6-653d0e1ede67') as profile_count,
  (SELECT COUNT(*) FROM public.bookings WHERE user_id = '70a7bc52-5385-4fea-b9f6-653d0e1ede67') as booking_count;

-- 7. Check available hotels for booking
SELECT 
  'Available hotels' as info,
  id,
  name,
  location
FROM public.hotels 
ORDER BY name
LIMIT 3;
