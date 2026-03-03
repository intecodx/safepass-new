-- Add work_company column to construction_plans table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'construction_plans' 
        AND column_name = 'work_company'
    ) THEN
        ALTER TABLE construction_plans ADD COLUMN work_company TEXT;
        RAISE NOTICE 'work_company column added to construction_plans table';
    ELSE
        RAISE NOTICE 'work_company column already exists in construction_plans table';
    END IF;
END $$;

-- Update existing records to have empty work_company if null
UPDATE construction_plans 
SET work_company = '' 
WHERE work_company IS NULL;
