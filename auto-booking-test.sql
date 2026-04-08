-- Auto booking test - gets hotel ID and tests booking automatically
-- Run this in Supabase SQL Editor

-- 1. Test booking with automatic hotel ID selection
DO $$
DECLARE
  hotel_id UUID;
  booking_result BOOLEAN;
BEGIN
  -- Get first available hotel ID automatically
  SELECT id INTO hotel_id 
  FROM public.hotels 
  LIMIT 1;
  
  -- Try to insert booking with that hotel ID
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
    hotel_id,
    auth.uid(),
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
  SELECT COUNT(*) > 0 INTO booking_result
  FROM public.bookings 
  WHERE user_id = auth.uid()
  AND created_at >= NOW() - INTERVAL '1 minute';
  
  -- Clean up test booking
  IF booking_result THEN
    DELETE FROM public.bookings 
    WHERE user_id = auth.uid()
    AND created_at >= NOW() - INTERVAL '1 minute';
    
    RAISE NOTICE '✅ Booking test SUCCESSFUL! Hotel ID: %, User ID: %', hotel_id, auth.uid();
  ELSE
    RAISE NOTICE '❌ Booking test FAILED! No booking found for user %', auth.uid();
  END IF;
END $$;

-- 2. Show current bookings after test
SELECT 
  'Current Bookings After Test' as info,
  COUNT(*) as total_bookings,
  MIN(created_at) as earliest_booking,
  MAX(created_at) as latest_booking
FROM public.bookings 
WHERE user_id = auth.uid();

-- 3. Show available hotels for reference
SELECT 
  'Available Hotels' as info,
  id,
  name,
  location,
  price_per_night
FROM public.hotels 
ORDER BY name;
