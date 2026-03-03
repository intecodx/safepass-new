-- 🚀 Safe Pass 시스템 완전 초기화 및 마이그레이션
-- 2025년 1월 8일 - v77 기준 완전 마이그레이션
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요

-- ========================================
-- 1. 기존 데이터 및 테이블 완전 삭제
-- ========================================
DROP POLICY IF EXISTS "Allow anonymous access to access_logs" ON access_logs;
DROP POLICY IF EXISTS "Allow anonymous access to admins" ON admins;
DROP POLICY IF EXISTS "Allow anonymous access to users" ON users;
DROP POLICY IF EXISTS "Allow anonymous access to construction_plans" ON construction_plans;
DROP POLICY IF EXISTS "Enable update access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert access for all users" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON construction_plans;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON admins;

DROP TRIGGER IF EXISTS trigger_generate_qr_code ON users;
DROP FUNCTION IF EXISTS generate_qr_code();
DROP FUNCTION IF EXISTS update_user_status(INTEGER, VARCHAR);
DROP FUNCTION IF EXISTS add_access_log(INTEGER, VARCHAR, VARCHAR);

DROP VIEW IF EXISTS daily_access_stats;
DROP VIEW IF EXISTS user_statistics;

DROP TABLE IF EXISTS access_logs CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS construction_plans CASCADE;

-- ========================================
-- 2. 공사계획 테이블 생성 (v77 기준)
-- ========================================
CREATE TABLE construction_plans (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  company VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  site_manager VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'ongoing', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 3. 사용자 테이블 생성 (v77 기준)
-- ========================================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  nationality VARCHAR(10) DEFAULT 'KR',
  passport_number VARCHAR(50),
  birth_date DATE NOT NULL,
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),
  construction_plan_id INTEGER REFERENCES construction_plans(id),
  roles JSONB DEFAULT '{"site_manager": false, "vehicle_owner": false}',
  vehicle_info JSONB,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  qr_code_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 4. 관리자 테이블 생성
-- ========================================
CREATE TABLE admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 5. 출입 기록 테이블 생성
-- ========================================
CREATE TABLE access_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  entry_time TIMESTAMP WITH TIME ZONE,
  exit_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 6. 인덱스 생성 (성능 최적화)
-- ========================================
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_construction_plan ON users(construction_plan_id);
CREATE INDEX idx_construction_plans_status ON construction_plans(status);
CREATE INDEX idx_access_logs_user_id ON access_logs(user_id);
CREATE INDEX idx_construction_plans_company ON construction_plans(company);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_access_logs_entry_time ON access_logs(entry_time);
CREATE INDEX idx_access_logs_exit_time ON access_logs(exit_time);
CREATE INDEX idx_users_nationality ON users(nationality);

-- ========================================
-- 7. RLS (Row Level Security) 설정
-- ========================================
ALTER TABLE construction_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 8. 공개 접근 정책 (익명 사용자 허용)
-- ========================================

-- 공사계획 모든 접근 허용
CREATE POLICY "Enable read access for all users" ON construction_plans FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON construction_plans FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON construction_plans FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON construction_plans FOR DELETE USING (true);

-- 사용자 테이블 모든 접근 허용
CREATE POLICY "Enable read access for all users" ON users FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON users FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON users FOR DELETE USING (true);

-- 관리자 테이블 읽기 허용
CREATE POLICY "Enable read access for authenticated users" ON admins FOR SELECT USING (true);

-- 출입 기록 모든 접근 허용
CREATE POLICY "Enable all access for access_logs" ON access_logs FOR ALL USING (true);

-- ========================================
-- 9. v77 기준 초기 공사계획 데이터 삽입
-- ========================================
INSERT INTO construction_plans (title, description, company, start_date, end_date, site_manager, status) VALUES
('A동 전기공사', 'A동 전기설비 교체 및 보수공사
- 전력 케이블 교체
- 분전반 설치
- 조명 시설 개선', '(주)한국전기공사', '2024-02-01', '2024-03-31', '김현장', 'ongoing'),

('B동 배관공사', 'B동 급수배관 교체공사
- 노후 배관 철거
- 신규 배관 설치
- 누수 점검 및 보수', '(주)대한배관', '2024-02-15', '2024-04-15', '이현장', 'planned'),

('C동 도장공사', 'C동 외벽 도장 및 방수공사
- 기존 도장 제거
- 방수 처리
- 외벽 도장 작업', '(주)미래도장', '2024-03-01', '2024-05-01', '정현장', 'planned');

-- ========================================
-- 10. 초기 관리자 계정 생성 (비밀번호: 123)
-- ========================================
INSERT INTO admins (username, password) VALUES
('123', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- ========================================
-- 11. v77 기준 샘플 사용자 데이터 삽입
-- ========================================
INSERT INTO users (name, phone, nationality, passport_number, birth_date, gender, construction_plan_id, roles, vehicle_info, status) VALUES
('김근로자', '010-1234-5678', 'KR', NULL, '1990-01-01', 'male', 1, '{"site_manager": true, "vehicle_owner": false}', NULL, 'pending'),
('John Smith', '010-9876-5432', 'US', 'P123456789', '1985-05-15', 'male', 2, '{"site_manager": false, "vehicle_owner": true}', '{"number": "12가3456", "type": "승용차"}', 'approved');

-- ========================================
-- 12. 편의 함수들 생성
-- ========================================

-- 사용자 상태 업데이트 함수
CREATE OR REPLACE FUNCTION update_user_status(user_id_param INTEGER, new_status VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE users SET 
        status = new_status,
        qr_code_url = CASE 
            WHEN new_status = 'approved' THEN 'https://example.com/qr/' || user_id_param
            ELSE qr_code_url
        END
    WHERE id = user_id_param;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 출입 기록 추가 함수
CREATE OR REPLACE FUNCTION add_access_log(user_id_param INTEGER, entry_time_param TIMESTAMP DEFAULT NOW())
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO access_logs (user_id, entry_time)
    VALUES (user_id_param, entry_time_param);
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 퇴근 기록 추가 함수
CREATE OR REPLACE FUNCTION add_checkout_log(user_id_param INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE access_logs 
    SET exit_time = NOW()
    WHERE user_id = user_id_param 
    AND exit_time IS NULL
    ORDER BY entry_time DESC
    LIMIT 1;
    
    IF NOT FOUND THEN
        INSERT INTO access_logs (user_id, exit_time)
        VALUES (user_id_param, NOW());
    END IF;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 13. 통계 조회 뷰 생성
-- ========================================

-- 사용자 통계 뷰
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_users,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_users,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_users,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_users,
    COUNT(CASE WHEN nationality = 'KR' THEN 1 END) as domestic_users,
    COUNT(CASE WHEN nationality != 'KR' THEN 1 END) as foreign_users,
    COUNT(CASE WHEN roles->>'site_manager' = 'true' THEN 1 END) as site_managers,
    COUNT(CASE WHEN roles->>'vehicle_owner' = 'true' THEN 1 END) as vehicle_owners
FROM users;

-- 공사별 사용자 통계 뷰
CREATE OR REPLACE VIEW construction_user_stats AS
SELECT 
    cp.id,
    cp.title,
    cp.company,
    cp.site_manager,
    cp.status as project_status,
    COUNT(u.id) as total_users,
    COUNT(CASE WHEN u.status = 'pending' THEN 1 END) as pending_users,
    COUNT(CASE WHEN u.status = 'approved' THEN 1 END) as approved_users,
    COUNT(CASE WHEN u.status = 'completed' THEN 1 END) as completed_users,
    COUNT(CASE WHEN u.status = 'rejected' THEN 1 END) as rejected_users
FROM construction_plans cp
LEFT JOIN users u ON cp.id = u.construction_plan_id
GROUP BY cp.id, cp.title, cp.company, cp.site_manager, cp.status
ORDER BY cp.created_at DESC;

-- 일별 출입 통계 뷰
CREATE OR REPLACE VIEW daily_access_stats AS
SELECT 
    DATE(entry_time) as access_date,
    COUNT(*) as total_entries,
    COUNT(CASE WHEN exit_time IS NOT NULL THEN 1 END) as completed_exits,
    COUNT(CASE WHEN exit_time IS NULL THEN 1 END) as ongoing_entries,
    COUNT(DISTINCT user_id) as unique_users
FROM access_logs
WHERE entry_time IS NOT NULL
GROUP BY DATE(entry_time)
ORDER BY access_date DESC;

-- ========================================
-- 14. 완료 확인 및 결과 출력
-- ========================================
SELECT 
    '🎉 Safe Pass v77 Supabase 마이그레이션 완료!' as status,
    (SELECT COUNT(*) FROM construction_plans) as construction_plans_count,
    (SELECT COUNT(*) FROM users) as users_count,
    (SELECT COUNT(*) FROM admins) as admins_count,
    (SELECT COUNT(*) FROM access_logs) as access_logs_count,
    '관리자 계정: 123/123' as admin_info;

-- 테이블별 상세 정보 출력
SELECT 'construction_plans' as table_name, COUNT(*) as record_count FROM construction_plans
UNION ALL
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'admins' as table_name, COUNT(*) as record_count FROM admins
UNION ALL
SELECT 'access_logs' as table_name, COUNT(*) as record_count FROM access_logs
ORDER BY table_name;

-- 사용자 상태별 통계 출력
SELECT * FROM user_statistics;

-- 공사별 사용자 현황 출력
SELECT * FROM construction_user_stats;
