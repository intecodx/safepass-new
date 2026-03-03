-- Supabase 마이그레이션 스크립트
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요

-- 1. 공사계획 테이블
CREATE TABLE IF NOT EXISTS construction_plans (
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

-- 2. 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
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

-- 3. 관리자 테이블
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 출입 기록 테이블
CREATE TABLE IF NOT EXISTS access_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  entry_time TIMESTAMP WITH TIME ZONE,
  exit_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_construction_plan ON users(construction_plan_id);
CREATE INDEX IF NOT EXISTS idx_construction_plans_status ON construction_plans(status);
CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON access_logs(user_id);

-- 6. RLS (Row Level Security) 정책 설정
ALTER TABLE construction_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- 7. 공개 읽기 정책 (익명 사용자도 읽기 가능)
CREATE POLICY "Enable read access for all users" ON construction_plans FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON users FOR SELECT USING (true);

-- 8. 공개 쓰기 정책 (익명 사용자도 쓰기 가능)
CREATE POLICY "Enable insert access for all users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON users FOR UPDATE USING (true);

-- 9. 관리자 테이블은 인증된 사용자만 접근
CREATE POLICY "Enable read access for authenticated users" ON admins FOR SELECT USING (auth.role() = 'authenticated');

-- 10. 초기 데이터 삽입
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
- 외벽 도장 작업', '(주)미래도장', '2024-03-01', '2024-05-01', '정현장', 'planned')
ON CONFLICT DO NOTHING;

-- 11. 초기 관리자 계정 (비밀번호: 123)
INSERT INTO admins (username, password) VALUES
('123', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON CONFLICT (username) DO NOTHING;

-- 12. 샘플 사용자 데이터
INSERT INTO users (name, phone, nationality, passport_number, birth_date, gender, construction_plan_id, roles, vehicle_info, status) VALUES
('김근로자', '010-1234-5678', 'KR', NULL, '1990-01-01', 'male', 1, '{"site_manager": true, "vehicle_owner": false}', NULL, 'pending'),
('John Smith', '010-9876-5432', 'US', 'P123456789', '1985-05-15', 'male', 2, '{"site_manager": false, "vehicle_owner": true}', '{"number": "12가3456", "type": "승용차"}', 'approved')
ON CONFLICT (phone) DO NOTHING;

-- 완료 메시지
SELECT 'Supabase 마이그레이션이 완료되었습니다! 🎉' as message;
