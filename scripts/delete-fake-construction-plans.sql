-- Delete fake/test construction plan data
DELETE FROM construction_plans 
WHERE title IN (
  'A동 전기공사',
  'B동 배관공사', 
  'C동 도장공사',
  'D동 보일러실 정비',
  '전체동 수방시설 점검'
);

-- Also delete any users associated with these construction plans
DELETE FROM users 
WHERE construction_plan_id IN (
  SELECT id FROM construction_plans 
  WHERE title IN (
    'A동 전기공사',
    'B동 배관공사',
    'C동 도장공사', 
    'D동 보일러실 정비',
    '전체동 수방시설 점검'
  )
);
