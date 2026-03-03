-- Remove the existing unique constraint on phone field
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_phone_key;

-- Add a composite unique constraint on phone and construction_plan_id
-- This allows the same phone number for different construction plans
-- but prevents duplicate registrations for the same construction plan
ALTER TABLE users ADD CONSTRAINT users_phone_construction_plan_unique 
UNIQUE (phone, construction_plan_id);

-- Add an index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_phone_construction_plan 
ON users (phone, construction_plan_id);
