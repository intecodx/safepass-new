-- 공사계획 테이블
CREATE TABLE construction_plans (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  site_manager VARCHAR(100),
  vehicle_owner VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 사용자 테이블
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(255),
  nationality VARCHAR(10) DEFAULT 'domestic', -- 'domestic' or 'foreign'
  passport_number VARCHAR(50),
  construction_plan_id INTEGER REFERENCES construction_plans(id),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
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

-- 초기 데이터 삽입
INSERT INTO construction_plans (title, description, site_manager, vehicle_owner, start_date, end_date) VALUES
('A동 전기공사', 'A동 전기설비 교체 및 보수공사', '김현장', '박차주', '2024-02-01', '2024-03-31'),
('B동 배관공사', 'B동 급수배관 교체공사', '이현장', '최차주', '2024-02-15', '2024-04-15'),
('C동 도장공사', 'C동 외벽 도장 및 방수공사', '정현장', '한차주', '2024-03-01', '2024-05-01');

INSERT INTO admins (username, password) VALUES
('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'); -- password: password
