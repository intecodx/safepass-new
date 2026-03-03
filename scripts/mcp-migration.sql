-- MCP 서버 설정 마이그레이션 스크립트
-- 실행 위치: Supabase Dashboard > SQL Editor

-- MCP 서버 설정을 저장할 테이블 생성
CREATE TABLE IF NOT EXISTS mcp_servers (
  id SERIAL PRIMARY KEY,
  server_name VARCHAR(100) NOT NULL UNIQUE,
  command VARCHAR(255) NOT NULL,
  args JSONB NOT NULL DEFAULT '[]',
  env JSONB NOT NULL DEFAULT '{}',
  is_read_only BOOLEAN DEFAULT true,
  project_ref VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_mcp_servers_name ON mcp_servers(server_name);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_status ON mcp_servers(status);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_project_ref ON mcp_servers(project_ref);

-- 업데이트 시간 자동 갱신을 위한 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
DROP TRIGGER IF EXISTS update_mcp_servers_updated_at ON mcp_servers;
CREATE TRIGGER update_mcp_servers_updated_at
    BEFORE UPDATE ON mcp_servers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 현재 MCP 설정 데이터 마이그레이션
INSERT INTO mcp_servers (
  server_name,
  command,
  args,
  env,
  is_read_only,
  project_ref,
  status,
  description
) VALUES (
  'supabase',
  'cmd',
  '["/c", "npx", "-y", "@supabase/mcp-server-supabase@latest", "--read-only", "--project-ref=jzxdmycrgztdxludzuwk"]'::jsonb,
  '{"SUPABASE_ACCESS_TOKEN": "sbp_40c8271cad6abd7a0af1dec0573b67387032369c"}'::jsonb,
  true,
  'jzxdmycrgztdxludzuwk',
  'active',
  'Supabase MCP 서버 - 프로젝트 데이터베이스 연동을 위한 읽기 전용 서버'
) ON CONFLICT (server_name) DO UPDATE SET
  command = EXCLUDED.command,
  args = EXCLUDED.args,
  env = EXCLUDED.env,
  is_read_only = EXCLUDED.is_read_only,
  project_ref = EXCLUDED.project_ref,
  status = EXCLUDED.status,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- 행 수준 보안(RLS) 비활성화 (개발용)
ALTER TABLE mcp_servers DISABLE ROW LEVEL SECURITY;
