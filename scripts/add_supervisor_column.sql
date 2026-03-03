-- Add supervisor column to construction_plans table
ALTER TABLE construction_plans 
ADD COLUMN supervisor character varying;

-- Update existing records with default value if needed
UPDATE construction_plans 
SET supervisor = '' 
WHERE supervisor IS NULL;
