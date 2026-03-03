-- 목업 데이터 삭제 스크립트 생성
-- 사용자가 직접 만들지 않은 테스트/더미 데이터 삭제

-- 1. 시장 지표 데이터 삭제 (시스템과 무관한 데이터)
DELETE FROM market_indicators;

-- 2. 엑셀 테스트 데이터 삭제
DELETE FROM excel_data;

-- 3. 초대 테스트 데이터 삭제
DELETE FROM invitations;

-- 4. MCP 서버 테스트 데이터 삭제
DELETE FROM mcp_servers;

-- 5. 출입 로그 데이터 삭제 (테스트 데이터)
DELETE FROM access_logs;

-- 6. 테스트용 사용자 데이터 삭제 (실제 사용자가 아닌 더미 데이터)
-- 주의: 실제 사용자 데이터가 있다면 조건을 추가해서 선별적으로 삭제
DELETE FROM users WHERE created_at < NOW() - INTERVAL '1 day' OR name LIKE '%테스트%' OR name LIKE '%test%';

-- 7. 테스트용 공사계획 데이터 삭제
DELETE FROM construction_plans WHERE title LIKE '%테스트%' OR title LIKE '%test%' OR title LIKE '%샘플%';

-- 8. 관리자 계정 중 테스트 계정 삭제 (기본 admin 계정은 유지)
DELETE FROM admins WHERE username != 'admin' AND (username LIKE '%test%' OR username LIKE '%테스트%');

-- 완료 메시지
SELECT '목업 데이터 삭제 완료' as message;
