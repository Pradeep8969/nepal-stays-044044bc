-- Create RPC function to delete booking with proper permissions
-- Run this in Supabase SQL Editor

-- Create function to delete user's own booking
CREATE OR REPLACE FUNCTION delete_user_booking(booking_id_to_delete UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    booking_user_id UUID;
BEGIN
    -- Get the current authenticated user ID
    current_user_id := auth.uid();
    
    -- Check if user is authenticated
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- Get the user_id of the booking to be deleted
    SELECT user_id INTO booking_user_id
    FROM public.bookings
    WHERE id = booking_id_to_delete;
    
    -- Check if booking exists
    IF booking_user_id IS NULL THEN
        RAISE EXCEPTION 'Booking not found';
    END IF;
    
    -- Check if the booking belongs to the current user
    IF booking_user_id != current_user_id THEN
        RAISE EXCEPTION 'You can only delete your own bookings';
    END IF;
    
    -- Delete the booking
    DELETE FROM public.bookings
    WHERE id = booking_id_to_delete AND user_id = current_user_id;
    
    -- Return success
    RETURN TRUE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_booking TO authenticated;

-- Test the function (optional - you can run this to test)
-- SELECT delete_user_booking('your-booking-id-here');
