-- 모든 가짜/테스트 데이터 삭제 스크립트
-- 출입신청(users)과 공사계획(construction_plans) 테이블의 모든 데이터를 삭제합니다

-- 1. 먼저 users 테이블의 모든 데이터 삭제 (외래키 제약조건 때문에 먼저 삭제)
DELETE FROM users;

-- 2. construction_plans 테이블의 모든 데이터 삭제
DELETE FROM construction_plans;

-- 3. access_logs 테이블의 모든 데이터 삭제
DELETE FROM access_logs;

-- 4. 시퀀스 리셋 (ID를 1부터 다시 시작)
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE construction_plans_id_seq RESTART WITH 1;
ALTER SEQUENCE access_logs_id_seq RESTART WITH 1;

-- 완료 메시지
SELECT '모든 가짜 데이터가 성공적으로 삭제되었습니다.' as message;
