-- Create a table for therapist's notes about patients
CREATE TABLE IF NOT EXISTS patient_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  therapist_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Create a unique constraint to ensure one therapist has one set of notes per patient
  CONSTRAINT unique_therapist_patient_notes UNIQUE (therapist_id, patient_id)
);

-- Add Row Level Security (RLS) policies
ALTER TABLE patient_notes ENABLE ROW LEVEL SECURITY;

-- Create policy to let therapists read their own notes
CREATE POLICY "Therapists can read their own patient notes"
  ON patient_notes
  FOR SELECT
  USING (auth.uid() = therapist_id);

-- Create policy to let therapists create notes for their patients
CREATE POLICY "Therapists can create notes for their patients"
  ON patient_notes
  FOR INSERT
  WITH CHECK (auth.uid() = therapist_id);

-- Create policy to let therapists update their own notes
CREATE POLICY "Therapists can update their own notes"
  ON patient_notes
  FOR UPDATE
  USING (auth.uid() = therapist_id);

-- Create policy to let therapists delete their own notes
CREATE POLICY "Therapists can delete their own notes"
  ON patient_notes
  FOR DELETE
  USING (auth.uid() = therapist_id);

-- Add a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at timestamp
CREATE TRIGGER update_patient_notes_timestamp
BEFORE UPDATE ON patient_notes
FOR EACH ROW
EXECUTE FUNCTION update_modified_column(); 