-- Add supervisor column to construction_plans table
ALTER TABLE construction_plans 
ADD COLUMN supervisor VARCHAR(255);

-- Add comment to the column
COMMENT ON COLUMN construction_plans.supervisor IS 'Name of the construction supervisor';
