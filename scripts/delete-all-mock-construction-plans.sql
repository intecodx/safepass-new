-- Delete all mock/test construction plan data
-- This will remove the fake construction plans shown in the admin interface

-- Delete all construction plans with these specific test company names
DELETE FROM construction_plans 
WHERE company IN (
    '(주)한국전기공사',
    '(주)대한배관', 
    '(주)미래도장',
    '(주)열관리시스템',
    '(주)안전소방'
);

-- Delete all construction plans with these specific test titles
DELETE FROM construction_plans 
WHERE title IN (
    'A동 전기공사',
    'B동 배관공사',
    'C동 도장공사', 
    'D동 보일러실 정비',
    '전체동 수방시설 점검'
);

-- Delete any users associated with these construction plans (cleanup orphaned records)
DELETE FROM users 
WHERE construction_plan_id NOT IN (
    SELECT id FROM construction_plans
);

-- Reset the construction_plans sequence if needed
SELECT setval('construction_plans_id_seq', COALESCE(MAX(id), 1)) FROM construction_plans;

-- Display remaining construction plans count
SELECT COUNT(*) as remaining_construction_plans FROM construction_plans;
