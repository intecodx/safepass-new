-- 🚀 Supabase 마이그레이션 스크립트 v2.0
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요

-- ========================================
-- 1. 기존 테이블 삭제 (있다면)
-- ========================================
DROP TABLE IF EXISTS access_logs CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS construction_plans CASCADE;

-- ========================================
-- 2. 공사계획 테이블 생성
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
-- 3. 사용자 테이블 생성
-- ========================================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(255),
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
CREATE INDEX idx_construction_plans_dates ON construction_plans(start_date, end_date);

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

-- 공사계획 읽기 허용
CREATE POLICY "Enable read access for construction_plans" 
ON construction_plans FOR SELECT 
USING (true);

-- 사용자 테이블 읽기/쓰기 허용
CREATE POLICY "Enable read access for users" 
ON users FOR SELECT 
USING (true);

CREATE POLICY "Enable insert access for users" 
ON users FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Enable update access for users" 
ON users FOR UPDATE 
USING (true);

-- 관리자 테이블은 제한적 접근
CREATE POLICY "Enable read access for admins" 
ON admins FOR SELECT 
USING (true);

-- 출입 기록 읽기/쓰기 허용
CREATE POLICY "Enable all access for access_logs" 
ON access_logs FOR ALL 
USING (true);

-- ========================================
-- 9. 초기 공사계획 데이터 삽입
-- ========================================
INSERT INTO construction_plans (title, description, company, start_date, end_date, site_manager, status) VALUES
('A동 전기공사', 'A동 전기설비 교체 및 보수공사
- 전력 케이블 교체 (500m)
- 분전반 설치 (15개소)
- 조명 시설 개선 (LED 교체)
- 비상전원 시설 점검', '(주)한국전기공사', '2024-02-01', '2024-03-31', '김현장', 'ongoing'),

('B동 배관공사', 'B동 급수배관 교체공사
- 노후 배관 철거 (지하 1층~5층)
- 신규 배관 설치 (스테인리스 파이프)
- 누수 점검 및 보수
- 급수펌프 교체', '(주)대한배관', '2024-02-15', '2024-04-15', '이현장', 'planned'),

('C동 도장공사', 'C동 외벽 도장 및 방수공사
- 기존 도장 제거 (고압세척)
- 방수 처리 (우레탄 방수)
- 외벽 도장 작업 (친환경 페인트)
- 발코니 난간 보수', '(주)미래도장', '2024-03-01', '2024-05-01', '정현장', 'planned'),

('D동 보일러실 정비', 'D동 보일러실 종합 정비공사
- 보일러 점검 및 청소
- 배관 보온재 교체
- 안전밸브 교체
- 연소실 정비', '(주)열관리시스템', '2024-03-15', '2024-04-30', '박현장', 'planned'),

('전체동 소방시설 점검', '전 건물 소방시설 정기점검
- 스프링클러 시스템 점검
- 화재감지기 교체
- 소화기 점검 및 교체
- 비상구 안전시설 점검', '(주)안전소방', '2024-04-01', '2024-04-15', '최현장', 'planned');

-- ========================================
-- 10. 초기 관리자 계정 생성
-- ========================================
INSERT INTO admins (username, password) VALUES
('123', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- ========================================
-- 11. 샘플 사용자 데이터 삽입
-- ========================================
INSERT INTO users (name, phone, nationality, passport_number, birth_date, gender, construction_plan_id, roles, vehicle_info, status) VALUES
('김근로자', '010-1234-5678', 'KR', NULL, '1990-01-01', 'male', 1, 
 '{"site_manager": true, "vehicle_owner": false}', NULL, 'pending'),

('John Smith', '010-9876-5432', 'US', 'P123456789', '1985-05-15', 'male', 2, 
 '{"site_manager": false, "vehicle_owner": true}', 
 '{"number": "12가3456", "type": "승용차"}', 'approved'),

('이작업자', '010-1111-2222', 'KR', NULL, '1988-03-20', 'male', 1, 
 '{"site_manager": false, "vehicle_owner": false}', NULL, 'approved'),

('박기술자', '010-3333-4444', 'KR', NULL, '1992-07-10', 'female', 3, 
 '{"site_manager": true, "vehicle_owner": true}', 
 '{"number": "34나5678", "type": "SUV"}', 'pending'),

('Wang Lei', '010-5555-6666', 'CN', 'C987654321', '1987-11-25', 'male', 4, 
 '{"site_manager": false, "vehicle_owner": false}', NULL, 'approved'),

('최안전관리자', '010-7777-8888', 'KR', NULL, '1980-05-15', 'male', 5, 
 '{"site_manager": true, "vehicle_owner": true}', 
 '{"number": "56다7890", "type": "화물차"}', 'approved');

-- ========================================
-- 12. 샘플 출입 기록 데이터
-- ========================================
INSERT INTO access_logs (user_id, entry_time, exit_time) VALUES
(2, '2024-02-01 08:30:00+09', '2024-02-01 17:30:00+09'),
(3, '2024-02-01 09:00:00+09', '2024-02-01 18:00:00+09'),
(5, '2024-02-02 08:00:00+09', '2024-02-02 17:00:00+09'),
(6, '2024-02-02 07:30:00+09', '2024-02-02 19:30:00+09'),
(2, '2024-02-03 08:30:00+09', NULL), -- 현재 출입 중
(3, '2024-02-03 09:15:00+09', NULL); -- 현재 출입 중

-- ========================================
-- 13. 완료 확인
-- ========================================
SELECT 
  '🎉 Supabase 마이그레이션 완료!' as status,
  (SELECT COUNT(*) FROM construction_plans) as construction_plans_count,
  (SELECT COUNT(*) FROM users) as users_count,
  (SELECT COUNT(*) FROM admins) as admins_count,
  (SELECT COUNT(*) FROM access_logs) as access_logs_count;

-- 테이블 구조 확인
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('construction_plans', 'users', 'admins', 'access_logs')
ORDER BY table_name, ordinal_position;
