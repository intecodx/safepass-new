-- 기존 공사계획들 삭제
-- 먼저 해당 공사계획을 참조하는 사용자들의 construction_plan_id를 NULL로 설정
UPDATE users 
SET construction_plan_id = NULL 
WHERE construction_plan_id IN (
  SELECT id FROM construction_plans 
  WHERE title IN ('a동 전기공사', 'A동 전기공사', 'b배관공사', 'B배관공사', 'c동 도장공사', 'C동 도장공사')
);

-- 공사계획 삭제
DELETE FROM construction_plans 
WHERE title IN ('a동 전기공사', 'A동 전기공사', 'b배관공사', 'B배관공사', 'c동 도장공사', 'C동 도장공사');

-- 삭제 결과 확인
SELECT 'Remaining construction plans:' as message;
SELECT id, title, company, site_manager FROM construction_plans ORDER BY created_at;

SELECT 'Users without construction plan:' as message;
SELECT COUNT(*) as count FROM users WHERE construction_plan_id IS NULL;
