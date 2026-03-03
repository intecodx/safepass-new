-- Updated migration script to match current codebase structure
-- Complete database migration script for current codebase version
-- Drop existing tables and recreate with current schema

-- Drop existing tables in correct order (considering foreign key constraints)
DROP TABLE IF EXISTS access_logs CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS construction_plans CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

-- Create admins table
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create construction_plans table with supervisor field
CREATE TABLE construction_plans (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    company VARCHAR(255) NOT NULL,
    site_manager VARCHAR(100) NOT NULL,
    supervisor VARCHAR(100) DEFAULT '',
    status VARCHAR(50) DEFAULT 'planned',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table (without email field as per current codebase)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    nationality VARCHAR(50) NOT NULL,
    passport_number VARCHAR(50),
    gender VARCHAR(10) NOT NULL,
    birth_date DATE NOT NULL,
    vehicle_info JSONB DEFAULT '{}',
    roles JSONB DEFAULT '{"site_manager": false, "vehicle_owner": false}',
    construction_plan_id INTEGER REFERENCES construction_plans(id),
    status VARCHAR(50) DEFAULT 'pending',
    qr_code_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create access_logs table
CREATE TABLE access_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    entry_time TIMESTAMP WITH TIME ZONE,
    exit_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default admin account (username: 1234, password: 1234)
INSERT INTO admins (username, password) VALUES ('1234', '1234');

-- Insert sample construction plans with supervisor field
INSERT INTO construction_plans (title, description, company, site_manager, supervisor, status, start_date, end_date) VALUES
('A동 전기공사', 'A동 전기설비 교체 및 보수공사
- 전력 케이블 교체
- 분전함 설치
- 조명 시설 개선', '(주)한국전기공사', '김현철', '이감독', 'ongoing', '2024-02-01', '2024-03-31'),
('B동 배관공사', 'B동 급수 및 배수 시설 개선
- 급수관 교체
- 배수관 정비
- 펌프 시설 점검', '(주)대한배관', '박관리', '최감독', 'planned', '2024-03-15', '2024-05-15'),
('C동 도장공사', 'C동 외벽 도장 및 방수 작업
- 외벽 도장
- 방수 처리
- 마감재 시공', '(주)미래도장', '정현장', '김감독', 'completed', '2024-01-10', '2024-02-28');

-- Insert sample users with proper roles structure
INSERT INTO users (name, phone, nationality, passport_number, gender, birth_date, construction_plan_id, roles, status) VALUES
('김철수', '010-1234-5678', '대한민국', 'M12345678', 'male', '1985-03-15', 1, '{"site_manager": true, "vehicle_owner": false}', 'approved'),
('이영희', '010-2345-6789', '대한민국', 'M23456789', 'female', '1990-07-22', 1, '{"site_manager": false, "vehicle_owner": false}', 'pending'),
('John Smith', '010-3456-7890', '미국', 'US1234567', 'male', '1988-11-10', 2, '{"site_manager": false, "vehicle_owner": true}', 'approved'),
('田中太郎', '010-4567-8901', '일본', 'JP9876543', 'male', '1992-05-08', 2, '{"site_manager": false, "vehicle_owner": false}', 'rejected'),
('王小明', '010-5678-9012', '중국', 'CN5555555', 'male', '1987-12-03', 3, '{"site_manager": true, "vehicle_owner": true}', 'completed');

-- Create indexes for better performance
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_construction_plan_id ON users(construction_plan_id);
CREATE INDEX idx_construction_plans_status ON construction_plans(status);
CREATE INDEX idx_construction_plans_dates ON construction_plans(start_date, end_date);
CREATE INDEX idx_access_logs_user_id ON access_logs(user_id);
CREATE INDEX idx_access_logs_entry_time ON access_logs(entry_time);

-- Enable Row Level Security (RLS) for security
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE construction_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (development mode)
CREATE POLICY "Enable all access for admins" ON admins FOR ALL USING (true);
CREATE POLICY "Enable all access for construction_plans" ON construction_plans FOR ALL USING (true);
CREATE POLICY "Enable all access for users" ON users FOR ALL USING (true);
CREATE POLICY "Enable all access for access_logs" ON access_logs FOR ALL USING (true);

-- Add comments for documentation
COMMENT ON TABLE admins IS 'Administrator accounts for system management';
COMMENT ON TABLE construction_plans IS 'Construction project plans and details';
COMMENT ON TABLE users IS 'User applications for site access (email field removed)';
COMMENT ON TABLE access_logs IS 'Entry and exit logs for approved users';

COMMENT ON COLUMN construction_plans.supervisor IS 'Construction supervisor name';
COMMENT ON COLUMN users.qr_code_url IS 'QR code URL for approved users';
COMMENT ON COLUMN users.vehicle_info IS 'JSON data containing vehicle information';
COMMENT ON COLUMN users.roles IS 'JSON object with site_manager and vehicle_owner booleans';

-- Verification query
SELECT 
  'Migration completed successfully!' as message,
  (SELECT COUNT(*) FROM admins) as admin_count,
  (SELECT COUNT(*) FROM construction_plans) as plans_count,
  (SELECT COUNT(*) FROM users) as users_count,
  (SELECT COUNT(*) FROM access_logs) as logs_count;
