-- 기존 테이블 삭제 (있다면)
DROP TABLE IF EXISTS access_logs CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS construction_plans CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

-- 공사계획 테이블 (개선된 구조)
CREATE TABLE construction_plans (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  company VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  site_manager VARCHAR(100) NOT NULL,
  supervisor VARCHAR(100),
  status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'ongoing', 'completed', 'cancelled')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 사용자 테이블 (개선된 구조)
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 관리자 테이블
CREATE TABLE admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 출입 기록 테이블
CREATE TABLE access_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  entry_time TIMESTAMP,
  exit_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_construction_plan ON users(construction_plan_id);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_construction_plans_status ON construction_plans(status);
CREATE INDEX idx_access_logs_user_id ON access_logs(user_id);

-- 초기 데이터 삽입
INSERT INTO construction_plans (title, description, company, site_manager, supervisor, start_date, end_date, status) VALUES
('A동 전기공사', 'A동 전기설비 교체 및 보수공사
- 고압/저압 배전반 교체
- 조명설비 LED 교체
- 비상발전기 점검', '(주)한국전기공사', '김현장', '박감독', '2024-02-01', '2024-03-31', 'ongoing'),

('B동 배관공사', 'B동 급수배관 교체공사
- 급수관 교체 (지하1층~10층)
- 밸브 및 계량기 교체
- 누수 점검', '(주)대한배관', '이현장', '최감독', '2024-02-15', '2024-04-15', 'planned'),

('C동 방수공사', 'C동 옥상 방수 및 외벽 보수공사
- 옥상 우레탄 방수
- 외벽 크랙 보수
- 실리콘 코킹 작업', '(주)건설방수', '정현장', '한감독', '2024-03-01', '2024-05-30', 'planned');

-- 관리자 계정 (기본 비밀번호: admin123)
INSERT INTO admins (username, password) VALUES
('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- 행 수준 보안(RLS) 비활성화 (개발용)
ALTER TABLE construction_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs DISABLE ROW LEVEL SECURITY;
