-- Create hotel submissions table for admin review
-- Run this in Supabase SQL Editor

-- Create hotel_submissions table
CREATE TABLE IF NOT EXISTS public.hotel_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_name TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  image_url TEXT,
  contact_phone TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  website TEXT,
  amenities TEXT,
  room_types TEXT,
  price_range TEXT,
  establishment_year TEXT,
  special_features TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  admin_notes TEXT,
  submission_data JSONB -- Store all form data as JSON for flexibility
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_hotel_submissions_status ON public.hotel_submissions(status);
CREATE INDEX IF NOT EXISTS idx_hotel_submissions_submitted_at ON public.hotel_submissions(submitted_at);

-- Enable Row Level Security
ALTER TABLE public.hotel_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for hotel_submissions
-- Allow anyone to insert submissions
CREATE POLICY "Anyone can insert hotel submissions" ON public.hotel_submissions
  FOR INSERT WITH CHECK (true);

-- Allow admins to read all submissions
CREATE POLICY "Admins can read all hotel submissions" ON public.hotel_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Allow admins to update submissions
CREATE POLICY "Admins can update hotel submissions" ON public.hotel_submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Allow admins to delete submissions
CREATE POLICY "Admins can delete hotel submissions" ON public.hotel_submissions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Grant permissions
GRANT ALL ON public.hotel_submissions TO authenticated;
GRANT SELECT ON public.hotel_submissions TO anon;
