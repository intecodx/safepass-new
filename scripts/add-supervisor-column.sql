-- Add supervisor column to construction_plans table
ALTER TABLE construction_plans 
ADD COLUMN supervisor VARCHAR;

-- Update existing records to have supervisor same as site_manager if needed
UPDATE construction_plans 
SET supervisor = site_manager 
WHERE supervisor IS NULL;
