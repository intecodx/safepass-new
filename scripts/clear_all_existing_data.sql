-- 기존 출입신청 인원들과 공사계획들을 모두 삭제하는 스크립트
-- 사용자가 새로 만든 공사계획만 남기기 위함

-- 1. 모든 출입 로그 삭제
DELETE FROM access_logs;

-- 2. 모든 사용자(출입신청자) 삭제
DELETE FROM users;

-- 3. 기존 샘플 공사계획들 삭제 (사용자가 만든 것 제외)
-- 일반적으로 샘플 데이터나 테스트 데이터를 삭제
DELETE FROM construction_plans 
WHERE title IN (
    'A동 전기공사',
    'B동 배관공사', 
    'C동 도장공사',
    'a동 전기공사',
    'b동 배관공사',
    'c동 도장공사'
) OR company IN (
    '(주)한국전기공사',
    '(주)대한배관',
    '(주)코리아도장'
);

-- 4. 관리자 계정은 유지 (1234/1234)
-- admins 테이블은 건드리지 않음

-- 5. 결과 확인
SELECT 'Construction Plans' as table_name, COUNT(*) as remaining_count FROM construction_plans
UNION ALL
SELECT 'Users' as table_name, COUNT(*) as remaining_count FROM users
UNION ALL
SELECT 'Access Logs' as table_name, COUNT(*) as remaining_count FROM access_logs
UNION ALL
SELECT 'Admins' as table_name, COUNT(*) as remaining_count FROM admins;

-- 6. 남은 공사계획 목록 확인
SELECT id, title, company, site_manager, supervisor, status, start_date, end_date 
FROM construction_plans 
ORDER BY created_at DESC;
