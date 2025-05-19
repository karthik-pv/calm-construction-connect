-- Create rapid_alerts table
CREATE TABLE IF NOT EXISTS rapid_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    handled BOOLEAN DEFAULT FALSE,
    handled_by UUID REFERENCES profiles(id),
    handled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE rapid_alerts ENABLE ROW LEVEL SECURITY;

-- Allow patients to create alerts
CREATE POLICY "Patients can create alerts"
ON rapid_alerts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = patient_id);

-- Allow therapists to view all alerts
CREATE POLICY "Therapists can view all alerts"
ON rapid_alerts FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.user_role IN ('therapist', 'relationship_expert', 'financial_expert', 'dating_coach', 'health_wellness_coach')
    )
);

-- Allow therapists to update alerts
CREATE POLICY "Therapists can update alerts"
ON rapid_alerts FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.user_role IN ('therapist', 'relationship_expert', 'financial_expert', 'dating_coach', 'health_wellness_coach')
    )
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_rapid_alerts_updated_at
    BEFORE UPDATE ON rapid_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 