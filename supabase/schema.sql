-- Run this in your Supabase SQL editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Families table
CREATE TABLE families (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL DEFAULT substr(md5(random()::text), 1, 8),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Family members (linked to auth users)
CREATE TABLE family_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  relation TEXT NOT NULL CHECK (relation IN ('father', 'mother', 'son', 'daughter', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, user_id)
);

-- Health records
CREATE TABLE health_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES family_members(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  report_date DATE,
  raw_text TEXT,
  structured_data JSONB DEFAULT '[]',
  file_url TEXT,
  file_type TEXT CHECK (file_type IN ('pdf', 'image')),
  uploaded_by_id UUID REFERENCES family_members(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;

-- Security definer function avoids infinite recursion in RLS policies
-- (querying family_members inside family_members policy causes a loop)
CREATE OR REPLACE FUNCTION public.get_my_family_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT family_id FROM public.family_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Policies use the function instead of a self-referencing subquery
CREATE POLICY "family_access" ON families
  FOR ALL USING (id = get_my_family_id());

CREATE POLICY "member_access" ON family_members
  FOR ALL USING (family_id = get_my_family_id());

CREATE POLICY "records_access" ON health_records
  FOR ALL USING (family_id = get_my_family_id());

-- Storage bucket (run after creating the bucket named "health-files" in Supabase dashboard)
-- Allow family members to upload/read files in their family folder
CREATE POLICY "family_storage_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'health-files');

CREATE POLICY "family_storage_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'health-files' AND auth.role() = 'authenticated');
