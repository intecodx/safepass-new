-- Add supervisor column to construction_plans table
ALTER TABLE construction_plans 
ADD COLUMN supervisor VARCHAR(255);

-- Update existing records to have empty string instead of null
UPDATE construction_plans 
SET supervisor = '' 
WHERE supervisor IS NULL;
