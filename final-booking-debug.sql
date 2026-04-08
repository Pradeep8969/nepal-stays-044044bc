-- Final booking debug script - working version
-- Run this in Supabase SQL Editor

-- 1. Check current state
SELECT 
  'Current Bookings Count' as info,
  COUNT(*) as total_bookings
FROM public.bookings;

-- 2. Get a real hotel ID to use for testing
SELECT 
  'Available Hotels' as info,
  id,
  name,
  location
FROM public.hotels 
ORDER BY name
LIMIT 3;

-- 3. Test booking with actual hotel ID (choose one from above)
-- Copy the ID from the results and paste it here
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
  'PASTE-HOTEL-ID-HERE',  -- Replace with actual hotel ID from step 2
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

-- 4. Check if test booking was created
SELECT 
  'Test Booking Result' as info,
  COUNT(*) as test_booking_count
FROM public.bookings 
WHERE user_id = auth.uid()
AND created_at >= NOW() - INTERVAL '1 minute';

-- 5. Clean up test data
DELETE FROM public.bookings 
WHERE user_id = auth.uid()
AND created_at >= NOW() - INTERVAL '1 minute';

-- 6. Check final state
SELECT 
  'Final State Check' as info,
  COUNT(*) as final_booking_count
FROM public.bookings;

-- 7. Check if RLS is enabled on bookings
SELECT 
  'RLS Status' as info,
  rowlevelsecurity
FROM pg_tables 
WHERE tablename = 'bookings'
AND schemaname = 'public';

-- 8. Check current RLS policies
SELECT 
  'Current RLS Policies' as info,
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'bookings';

-- 9. If RLS is enabled, temporarily disable it for testing
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'bookings' 
    AND schemaname = 'public' 
    AND rowlevelsecurity = true
  ) THEN
    EXECUTE 'ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY';
    RAISE NOTICE 'RLS temporarily disabled for testing';
  END IF;
END $$;

-- 10. Test booking with RLS disabled
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
  'PASTE-HOTEL-ID-HERE',  -- Replace with actual hotel ID from step 2
  auth.uid(),
  '2026-04-11',
  '2026-04-13',
  3,
  'Deluxe',
  '+977-1234567891',
  300.00,
  'confirmed',
  NOW()
);

-- 11. Check if second test worked
SELECT 
  'Test Booking 2 Result' as info,
  COUNT(*) as test_booking_2_count
FROM public.bookings 
WHERE user_id = auth.uid()
AND room_type = 'Deluxe';

-- 12. Clean up second test
DELETE FROM public.bookings 
WHERE user_id = auth.uid()
AND room_type = 'Deluxe';

-- 13. Re-enable RLS with simple policy
DO $$
BEGIN
  ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "Users can manage own bookings" ON public.bookings;
  DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
  
  CREATE POLICY "Users can manage own bookings" ON public.bookings
    FOR ALL USING (auth.uid() = user_id);
    
  CREATE POLICY "Admins can view all bookings" ON public.bookings
    FOR SELECT USING (
      auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE raw_user_meta_data->>'role' = 'admin'
      )
    );
    
  RAISE NOTICE 'RLS re-enabled with proper policies';
END $$;

-- 14. Final verification
SELECT 
  'Final Verification' as info,
  COUNT(*) as total_bookings_after_fix
FROM public.bookings;
