-- Workshop Calendar & Attendance System Schema
-- For Superteam Study Platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- WORKSHOPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS workshops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  location_type TEXT NOT NULL CHECK (location_type IN ('online', 'offline')),
  venue_name TEXT, -- For offline workshops
  meeting_link TEXT, -- For online workshops
  host_name TEXT NOT NULL,
  capacity INTEGER, -- NULL = unlimited
  image_url TEXT, -- Workshop image/thumbnail
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  qr_token TEXT UNIQUE, -- Unique token for QR code check-in
  qr_expires_at TIMESTAMP WITH TIME ZONE -- When QR code expires (after event end)
);

-- Indexes for workshops
CREATE INDEX IF NOT EXISTS idx_workshops_datetime ON workshops(datetime);
CREATE INDEX IF NOT EXISTS idx_workshops_location_type ON workshops(location_type);
CREATE INDEX IF NOT EXISTS idx_workshops_created_by ON workshops(created_by);
CREATE INDEX IF NOT EXISTS idx_workshops_qr_token ON workshops(qr_token);

-- ============================================
-- WORKSHOP REGISTRATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS workshop_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workshop_id UUID NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(workshop_id, user_id) -- Prevent duplicate registrations
);

-- Indexes for registrations
CREATE INDEX IF NOT EXISTS idx_registrations_workshop ON workshop_registrations(workshop_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user ON workshop_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_registered_at ON workshop_registrations(registered_at);

-- ============================================
-- ATTENDANCE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS workshop_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workshop_id UUID NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_time TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  method TEXT NOT NULL CHECK (method IN ('qr', 'manual')),
  checked_in_by UUID REFERENCES auth.users(id), -- Admin who marked manual attendance
  UNIQUE(workshop_id, user_id) -- One attendance per user per workshop
);

-- Indexes for attendance
CREATE INDEX IF NOT EXISTS idx_attendance_workshop ON workshop_attendance(workshop_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user ON workshop_attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_checkin_time ON workshop_attendance(checkin_time);

-- ============================================
-- PROOF OF ATTENDANCE (POA) TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS proof_of_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workshop_id UUID NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attendance_id UUID NOT NULL REFERENCES workshop_attendance(id) ON DELETE CASCADE,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  metadata JSONB DEFAULT '{}', -- Store additional data (XP awarded, badge earned, etc.)
  UNIQUE(workshop_id, user_id) -- One POA per user per workshop
);

-- Indexes for POA
CREATE INDEX IF NOT EXISTS idx_poa_workshop ON proof_of_attendance(workshop_id);
CREATE INDEX IF NOT EXISTS idx_poa_user ON proof_of_attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_poa_issued_at ON proof_of_attendance(issued_at);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_workshops_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_workshops_updated_at ON workshops;
CREATE TRIGGER update_workshops_updated_at
  BEFORE UPDATE ON workshops
  FOR EACH ROW
  EXECUTE FUNCTION update_workshops_updated_at();

-- Auto-generate QR token when workshop is created
CREATE OR REPLACE FUNCTION generate_workshop_qr_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.qr_token IS NULL THEN
    NEW.qr_token := encode(gen_random_bytes(32), 'hex');
  END IF;

  -- Always align QR expiration with the workshop day (00:00–23:59:59 UTC)
  NEW.qr_expires_at := date_trunc('day', NEW.datetime) + INTERVAL '1 day' - INTERVAL '1 millisecond';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS generate_workshop_qr_token ON workshops;
CREATE TRIGGER generate_workshop_qr_token
  BEFORE INSERT OR UPDATE ON workshops
  FOR EACH ROW
  EXECUTE FUNCTION generate_workshop_qr_token();

-- Auto-create POA when attendance is recorded
CREATE OR REPLACE FUNCTION create_proof_of_attendance()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO proof_of_attendance (workshop_id, user_id, attendance_id)
  VALUES (NEW.workshop_id, NEW.user_id, NEW.id)
  ON CONFLICT (workshop_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS create_proof_of_attendance ON workshop_attendance;
CREATE TRIGGER create_proof_of_attendance
  AFTER INSERT ON workshop_attendance
  FOR EACH ROW
  EXECUTE FUNCTION create_proof_of_attendance();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE proof_of_attendance ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view workshops" ON workshops;
DROP POLICY IF EXISTS "Admins can manage workshops" ON workshops;
DROP POLICY IF EXISTS "Users can view own registrations" ON workshop_registrations;
DROP POLICY IF EXISTS "Users can register for workshops" ON workshop_registrations;
DROP POLICY IF EXISTS "Users can view own attendance" ON workshop_attendance;
DROP POLICY IF EXISTS "Users can check in via QR" ON workshop_attendance;
DROP POLICY IF EXISTS "Admins can manage attendance" ON workshop_attendance;
DROP POLICY IF EXISTS "Users can view own POA" ON proof_of_attendance;
DROP POLICY IF EXISTS "Public can view POA" ON proof_of_attendance;
DROP POLICY IF EXISTS "Admins can insert POA" ON proof_of_attendance;
DROP POLICY IF EXISTS "Trigger can insert POA" ON proof_of_attendance;

-- Workshops: Public can view, admins can manage
CREATE POLICY "Public can view workshops" ON workshops
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage workshops" ON workshops
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = TRUE
    )
  );

-- Registrations: Users can view their own and register
CREATE POLICY "Users can view own registrations" ON workshop_registrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can register for workshops" ON workshop_registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Attendance: Users can view their own, check in via QR, admins can manage
CREATE POLICY "Users can view own attendance" ON workshop_attendance
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can check in via QR" ON workshop_attendance
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND method = 'qr'
    AND EXISTS (
      SELECT 1 FROM workshops
      WHERE workshops.id = workshop_id
      AND workshops.qr_token IS NOT NULL
      AND (workshops.qr_expires_at IS NULL OR workshops.qr_expires_at > NOW())
    )
  );

CREATE POLICY "Admins can manage attendance" ON workshop_attendance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = TRUE
    )
  );

-- POA: Users can view their own, public can view (for profile display)
CREATE POLICY "Users can view own POA" ON proof_of_attendance
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Public can view POA" ON proof_of_attendance
  FOR SELECT USING (true);

-- POA: Allow admins to insert (for manual check-ins)
CREATE POLICY "Admins can insert POA" ON proof_of_attendance
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = TRUE
    )
  );

-- ============================================
-- GRANTS
-- ============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON workshops TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON workshops TO authenticated;
GRANT SELECT, INSERT ON workshop_registrations TO authenticated;
GRANT SELECT, INSERT ON workshop_attendance TO authenticated;
GRANT SELECT ON proof_of_attendance TO anon, authenticated;
GRANT INSERT ON proof_of_attendance TO authenticated;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if user can register (capacity check)
CREATE OR REPLACE FUNCTION can_register_for_workshop(
  p_workshop_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_capacity INTEGER;
  v_registered_count INTEGER;
  v_already_registered BOOLEAN;
BEGIN
  -- Check if already registered
  SELECT EXISTS (
    SELECT 1 FROM workshop_registrations
    WHERE workshop_id = p_workshop_id AND user_id = p_user_id
  ) INTO v_already_registered;
  
  IF v_already_registered THEN
    RETURN FALSE;
  END IF;
  
  -- Get workshop capacity
  SELECT capacity INTO v_capacity FROM workshops WHERE id = p_workshop_id;
  
  -- If no capacity limit, allow registration
  IF v_capacity IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check current registrations
  SELECT COUNT(*) INTO v_registered_count
  FROM workshop_registrations
  WHERE workshop_id = p_workshop_id;
  
  RETURN v_registered_count < v_capacity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get workshop attendance stats
CREATE OR REPLACE FUNCTION get_workshop_stats(p_workshop_id UUID)
RETURNS TABLE (
  total_registrations BIGINT,
  total_attendance BIGINT,
  online_attendance BIGINT,
  offline_attendance BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM workshop_registrations WHERE workshop_id = p_workshop_id)::BIGINT,
    (SELECT COUNT(*) FROM workshop_attendance WHERE workshop_id = p_workshop_id)::BIGINT,
    (SELECT COUNT(*) FROM workshop_attendance wa
     JOIN workshops w ON wa.workshop_id = w.id
     WHERE wa.workshop_id = p_workshop_id AND w.location_type = 'online')::BIGINT,
    (SELECT COUNT(*) FROM workshop_attendance wa
     JOIN workshops w ON wa.workshop_id = w.id
     WHERE wa.workshop_id = p_workshop_id AND w.location_type = 'offline')::BIGINT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get team attendance KPIs
CREATE OR REPLACE FUNCTION get_team_attendance_kpis(p_team_id UUID)
RETURNS TABLE (
  total_workshops_attended BIGINT,
  online_attendance_count BIGINT,
  offline_attendance_count BIGINT,
  attendance_consistency_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH team_member_attendance AS (
    SELECT
      wa.workshop_id,
      w.location_type,
      COUNT(DISTINCT wa.user_id) as member_count
    FROM workshop_attendance wa
    JOIN workshops w ON wa.workshop_id = w.id
    JOIN team_members tm ON wa.user_id = tm.user_id
    WHERE tm.team_id = p_team_id
    GROUP BY wa.workshop_id, w.location_type
  )
  SELECT
    COUNT(DISTINCT workshop_id)::BIGINT as total_workshops_attended,
    SUM(CASE WHEN location_type = 'online' THEN 1 ELSE 0 END)::BIGINT as online_attendance_count,
    SUM(CASE WHEN location_type = 'offline' THEN 1 ELSE 0 END)::BIGINT as offline_attendance_count,
    CASE
      WHEN COUNT(DISTINCT workshop_id) > 0 THEN
        ROUND((COUNT(DISTINCT workshop_id)::NUMERIC / NULLIF((SELECT COUNT(*) FROM workshops WHERE datetime <= NOW()), 0)) * 100, 2)
      ELSE 0
    END as attendance_consistency_score
  FROM team_member_attendance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

