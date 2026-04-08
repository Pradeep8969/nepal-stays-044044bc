-- Simple booking debug - avoid information_schema issues
-- Run this in Supabase SQL Editor

-- 1. First, let's see what's actually in the bookings table
SELECT 
  'Current Bookings Count' as info,
  COUNT(*) as total_bookings
FROM public.bookings;

-- 2. Check if the bookings table exists and has the right structure
SELECT 
  'Bookings Table Exists' as info,
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name = 'bookings' AND table_schema = 'public';

-- 3. Try a direct test booking insert with a real hotel ID
-- First, let's get a real hotel ID
SELECT 
  'Get Real Hotel ID' as info,
  id as hotel_id,
  name as hotel_name
FROM public.hotels 
LIMIT 1;

-- 4. Now try to insert a test booking with that hotel ID
-- Replace 'YOUR-HOTEL-ID' with the actual ID from the query above
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
  'YOUR-HOTEL-ID',  -- Replace this with actual hotel ID from step 3
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

-- 5. Check if the test booking was created
SELECT 
  'Test Booking Result' as info,
  COUNT(*) as test_booking_count
FROM public.bookings 
WHERE user_id = auth.uid();

-- 6. Check what user ID we're actually using
SELECT 
  'Current User ID' as info,
  auth.uid() as current_user_id;

-- 7. If the test worked, let's clean it up
DELETE FROM public.bookings 
WHERE user_id = auth.uid()
AND created_at >= NOW() - INTERVAL '1 hour';

-- 8. Now let's check the current RLS policies
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
WHERE tablename = 'bookings';

-- 9. Let's temporarily disable RLS and see if that fixes it
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;

-- 10. Try another test booking with RLS disabled
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
  'YOUR-HOTEL-ID',  -- Replace this with actual hotel ID from step 3
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

-- 11. Check if the second test booking worked
SELECT 
  'Test Booking 2 Result' as info,
  COUNT(*) as test_booking_2_count
FROM public.bookings 
WHERE user_id = auth.uid()
AND room_type = 'Deluxe';

-- 12. Clean up the test data
DELETE FROM public.bookings 
WHERE user_id = auth.uid()
AND created_at >= NOW() - INTERVAL '1 hour';

-- 13. Re-enable RLS with a very permissive policy
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;

-- Create a very permissive policy for testing
CREATE POLICY "Allow all bookings" ON public.bookings
  FOR ALL USING (true);

-- 14. Final test with permissive policy
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
  'YOUR-HOTEL-ID',  -- Replace this with actual hotel ID from step 3
  auth.uid(),
  '2026-04-14',
  '2026-04-15',
  2,
  'Standard',
  '+977-1234567892',
  250.00,
  'confirmed',
  NOW()
);

-- 15. Check final result
SELECT 
  'Final Test Result' as info,
  COUNT(*) as final_booking_count
FROM public.bookings 
WHERE user_id = auth.uid()
AND total_price = 250.00;

-- 16. Clean up final test data
DELETE FROM public.bookings 
WHERE user_id = auth.uid()
AND total_price = 250.00;

-- 17. Restore proper RLS policies
DROP POLICY IF EXISTS "Allow all bookings" ON public.bookings;

CREATE POLICY "Users can manage own bookings" ON public.bookings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bookings" ON public.bookings
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 18. Final verification
SELECT 
  'Final Verification' as info,
  COUNT(*) as total_bookings_after_fix
FROM public.bookings;
