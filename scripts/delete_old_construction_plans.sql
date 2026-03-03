-- 기존 공사계획들을 삭제하고 사용자 연결을 정리하는 스크립트

-- 먼저 현재 공사계획 목록 확인
SELECT id, title, company FROM construction_plans;

-- 해당 공사계획을 참조하는 사용자들의 construction_plan_id를 NULL로 설정
UPDATE users 
SET construction_plan_id = NULL 
WHERE construction_plan_id IN (
    SELECT id FROM construction_plans 
    WHERE title IN ('A동 전기공사', 'B동 배관공사', 'C동 도장공사', 'a동 전기공사', 'b동 배관공사', 'c동 도장공사')
);

-- 기존 공사계획들 삭제 (대소문자 구분 없이)
DELETE FROM construction_plans 
WHERE LOWER(title) IN ('a동 전기공사', 'b동 배관공사', 'c동 도장공사');

-- 삭제 후 남은 공사계획 확인
SELECT id, title, company, site_manager, supervisor FROM construction_plans ORDER BY created_at DESC;

-- 공사계획이 없는 사용자 수 확인
SELECT COUNT(*) as users_without_plan FROM users WHERE construction_plan_id IS NULL;

-- 공사계획별 사용자 수 확인
SELECT 
    cp.title as plan_title,
    COUNT(u.id) as user_count
FROM construction_plans cp
LEFT JOIN users u ON cp.id = u.construction_plan_id
GROUP BY cp.id, cp.title
ORDER BY cp.created_at DESC;
