-- Update the construction_plans status check constraint to include 'same_day'
-- This allows for same-day construction plans where start_date equals end_date

-- Drop the existing constraint
ALTER TABLE construction_plans 
DROP CONSTRAINT IF EXISTS construction_plans_status_check;

-- Add the new constraint with 'same_day' included
ALTER TABLE construction_plans 
ADD CONSTRAINT construction_plans_status_check 
CHECK (status IN ('scheduled', 'in_progress', 'completed', 'suspended', 'same_day'));
