-- Create test bookings final - ensure admin dashboard shows data
-- Run this in Supabase SQL Editor

-- 1. Check current booking count
SELECT 
  'Current booking count' as info,
  COUNT(*) as total_bookings
FROM public.bookings;

-- 2. Check if hotels exist
SELECT 
  'Available hotels' as info,
  COUNT(*) as hotel_count,
  ARRAY_AGG(id) as hotel_ids
FROM public.hotels;

-- 3. Check if profiles exist for test users
SELECT 
  'Profile count' as info,
  COUNT(*) as profile_count
FROM public.profiles;

-- 4. Create profile for test user if it doesn't exist
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
) ON CONFLICT (user_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone;

-- 5. Create multiple test bookings with different hotels
DO $$
DECLARE
  hotel_ids UUID[];
  booking_count INTEGER := 0;
BEGIN
  -- Get all available hotel IDs
  SELECT ARRAY_AGG(id) INTO hotel_ids
  FROM public.hotels;
  
  IF array_length(hotel_ids, 1) > 0 THEN
    -- Create bookings for first 3 hotels
    FOR i IN 1..LEAST(3, array_length(hotel_ids, 1)) LOOP
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
        hotel_ids[i],
        '70a7bc52-5385-4fea-b9f6-653d0e1ede67',
        (CURRENT_DATE + INTERVAL '1 day')::TEXT,
        (CURRENT_DATE + INTERVAL '3 days')::TEXT,
        (1 + i)::INTEGER,
        CASE i
          WHEN 1 THEN 'Standard'
          WHEN 2 THEN 'Deluxe'
          ELSE 'Suite'
        END,
        '+977-1234567890',
        (100.00 * i)::DECIMAL(10,2),
        'confirmed',
        NOW() - INTERVAL '1 hour' * i
      );
      
      booking_count := booking_count + 1;
      RAISE NOTICE 'Created test booking % for hotel %', i, hotel_ids[i];
    END LOOP;
    
    RAISE NOTICE 'Total test bookings created: %', booking_count;
  ELSE
    RAISE NOTICE 'No hotels found - cannot create test bookings';
  END IF;
END $$;

-- 6. Verify bookings were created
SELECT 
  'Bookings after creation' as info,
  COUNT(*) as total_bookings
FROM public.bookings;

-- 7. Show sample booking data with hotel and profile info
SELECT 
  'Sample booking data with joins' as info,
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
  p.full_name as user_name,
  p.email as user_email
FROM public.bookings b
LEFT JOIN public.hotels h ON b.hotel_id = h.id
LEFT JOIN public.profiles p ON b.user_id = p.user_id
ORDER BY b.created_at DESC
LIMIT 5;

-- 8. Test the exact admin query that frontend uses
SELECT 
  'Admin frontend query test' as info,
  b.*,
  h.name,
  h.location,
  h.image_url,
  p.full_name,
  p.email
FROM public.bookings b
LEFT JOIN public.hotels h ON b.hotel_id = h.id
LEFT JOIN public.profiles p ON b.user_id = p.user_id
ORDER BY b.created_at DESC;

-- 9. Final status check
SELECT 
  'Final status' as info,
  (SELECT COUNT(*) FROM public.bookings) as total_bookings,
  (SELECT COUNT(*) FROM public.hotels) as total_hotels,
  (SELECT COUNT(*) FROM public.profiles) as total_profiles,
  CASE 
    WHEN (SELECT COUNT(*) FROM public.bookings) > 0 THEN 'Admin dashboard should now show bookings'
    ELSE 'Still no bookings - check hotel data'
  END as status;
