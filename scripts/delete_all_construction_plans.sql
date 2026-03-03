-- 모든 공사계획 삭제
-- 먼저 사용자들의 공사계획 참조를 제거
UPDATE users SET construction_plan_id = NULL WHERE construction_plan_id IS NOT NULL;

-- 모든 공사계획 삭제
DELETE FROM construction_plans;

-- 모든 사용자 삭제 (출입신청자들)
DELETE FROM users;

-- 모든 출입 로그 삭제
DELETE FROM entry_logs;

-- 확인
SELECT 'construction_plans' as table_name, COUNT(*) as count FROM construction_plans
UNION ALL
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'entry_logs' as table_name, COUNT(*) as count FROM entry_logs;
