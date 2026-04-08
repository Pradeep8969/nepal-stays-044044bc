-- Fix admin booking query syntax error - handle missing profiles and create test data
-- Run this in Supabase SQL Editor

-- 1. Check if bookings exist
SELECT 
  'Total bookings count' as info,
  COUNT(*) as count
FROM public.bookings;

-- 2. Check if profiles exist for booking users
SELECT 
  'Bookings without profiles' as info,
  COUNT(*) as count
FROM public.bookings b
LEFT JOIN public.profiles p ON b.user_id = p.user_id
WHERE p.user_id IS NULL;

-- 3. Show booking users who need profiles (fixed syntax)
SELECT 
  'Booking users needing profiles' as info,
  b.user_id,
  b.created_at as booking_date
FROM public.bookings b
LEFT JOIN public.profiles p ON b.user_id = p.user_id
WHERE p.user_id IS NULL
GROUP BY b.user_id, b.created_at;

-- 4. Create profiles for all booking users who don't have them (fixed syntax)
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT b.user_id, b.guest_phone
    FROM public.bookings b
    LEFT JOIN public.profiles p ON b.user_id = p.user_id
    WHERE p.user_id IS NULL
    GROUP BY b.user_id, b.guest_phone
  LOOP
    -- Get user info from auth.users
    INSERT INTO public.profiles (
      user_id,
      full_name,
      email,
      phone,
      created_at
    ) 
    SELECT 
      au.id,
      COALESCE(au.raw_user_meta_data->>'full_name', 'User ' || LEFT(au.email::text, 10)),
      au.email,
      COALESCE(user_record.guest_phone, '+977-0000000000'),
      NOW()
    FROM auth.users au
    WHERE au.id = user_record.user_id
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE 'Created profile for user: %', user_record.user_id;
  END LOOP;
END $$;

-- 5. If no bookings exist, create test booking with profile
DO $$
DECLARE
  booking_exists BOOLEAN;
  hotel_uuid UUID;
BEGIN
  -- Check if any bookings exist
  SELECT EXISTS(SELECT 1 FROM public.bookings) INTO booking_exists;
  
  IF NOT booking_exists THEN
    -- Get first available hotel ID
    SELECT id INTO hotel_uuid 
    FROM public.hotels 
    LIMIT 1;
    
    IF hotel_uuid IS NOT NULL THEN
      -- Create profile first if it doesn't exist
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
      ) ON CONFLICT (user_id) DO NOTHING;
      
      -- Create test booking
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
      
      RAISE NOTICE 'Created test booking and profile for admin dashboard';
    ELSE
      RAISE NOTICE 'No hotels found to create test booking';
    END IF;
  END IF;
END $$;

-- 6. Test the exact admin query with LEFT JOIN to handle missing profiles
SELECT 
  'Admin query test (with LEFT JOIN)' as info,
  b.id,
  b.hotel_id,
  b.user_id,
  b.check_in_date,
  b.check_out_date,
  b.guests,
  b.room_type,
  b.total_price,
  b.status,
  b.created_at,
  h.name as hotel_name,
  h.location as hotel_location,
  h.image_url as hotel_image,
  p.full_name,
  p.email
FROM public.bookings b
LEFT JOIN public.hotels h ON b.hotel_id = h.id
LEFT JOIN public.profiles p ON b.user_id = p.user_id
ORDER BY b.created_at DESC
LIMIT 5;

-- 7. Final verification
SELECT 
  'Final status' as info,
  (SELECT COUNT(*) FROM public.bookings) as total_bookings,
  (SELECT COUNT(*) FROM public.profiles) as total_profiles,
  (SELECT COUNT(*) FROM public.bookings b LEFT JOIN public.profiles p ON b.user_id = p.user_id WHERE p.user_id IS NOT NULL) as bookings_with_profiles,
  CASE 
    WHEN (SELECT COUNT(*) FROM public.bookings) > 0 THEN 'Admin dashboard should show bookings'
    ELSE 'Test booking created'
  END as status;
