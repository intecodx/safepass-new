-- Add site_manager_phone column to construction_plans table
ALTER TABLE construction_plans
ADD COLUMN IF NOT EXISTS site_manager_phone VARCHAR(20);

-- Add comment to the column
COMMENT ON COLUMN construction_plans.site_manager_phone IS '현장대리인 전화번호';
