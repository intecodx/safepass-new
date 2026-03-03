-- A동 전기공사, B동 배관공사, C동 도장공사 및 관련 인원 삭제

-- 1. 먼저 해당 공사계획에 속한 사용자들의 출입 로그 삭제
DELETE FROM access_logs 
WHERE user_id IN (
    SELECT id FROM users 
    WHERE construction_plan_id IN (
        SELECT id FROM construction_plans 
        WHERE title IN ('A동 전기공사', 'B동 배관공사', 'C동 도장공사', 'a동 전기공사', 'b동 배관공사', 'c동 도장공사')
    )
);

-- 2. 해당 공사계획에 속한 사용자들 삭제
DELETE FROM users 
WHERE construction_plan_id IN (
    SELECT id FROM construction_plans 
    WHERE title IN ('A동 전기공사', 'B동 배관공사', 'C동 도장공사', 'a동 전기공사', 'b동 배관공사', 'c동 도장공사')
);

-- C동 도장공사 추가 및 대소문자 구분 없이 삭제
-- 3. 해당 공사계획들 삭제
DELETE FROM construction_plans 
WHERE title IN ('A동 전기공사', 'B동 배관공사', 'C동 도장공사', 'a동 전기공사', 'b동 배관공사', 'c동 도장공사');

-- 완료 메시지
SELECT 'A동 전기공사, B동 배관공사, C동 도장공사 및 관련 인원이 성공적으로 삭제되었습니다.' as result;
