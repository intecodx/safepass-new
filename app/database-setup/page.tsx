"use client"

import { useEffect, useState } from "react"
import { getUserStats } from "@/lib/supabase-storage"
import { checkDatabaseStatus } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertTriangle, Database, RefreshCw, Copy, ExternalLink } from "lucide-react"
import Link from "next/link"

interface DatabaseStatus {
  status: "checking" | "ready" | "needs-setup" | "error"
  message: string
  details?: string
  data?: any
}

export default function DatabaseSetupPage() {
  const [databaseStatus, setDatabaseStatus] = useState<DatabaseStatus>({
    status: "checking",
    message: "데이터베이스 상태를 확인하고 있습니다...",
  })
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const checkDatabase = async () => {
    setIsLoading(true)
    setDatabaseStatus({
      status: "checking",
      message: "데이터베이스 상태를 확인하고 있습니다...",
    })

    try {
      console.log("🔄 데이터베이스 상태 확인 시작...")

      // Supabase 연결 및 테이블 상태 확인
      const dbStatus = await checkDatabaseStatus()
      console.log("📊 데이터베이스 상태:", dbStatus)

      if (dbStatus.status === "error") {
        setDatabaseStatus({
          status: "error",
          message: dbStatus.message,
          details: dbStatus.details,
        })
        return
      }

      if (dbStatus.status === "needs-setup") {
        setDatabaseStatus({
          status: "needs-setup",
          message: dbStatus.message,
        })
        return
      }

      // 통계 조회를 통해 데이터 확인
      const result = await getUserStats()
      setStats(result)

      // 모든 값이 0이면 테이블은 있지만 데이터가 없는 상태
      const hasAnyData = Object.values(result).some((value) => value > 0)

      if (hasAnyData || dbStatus.status === "ready") {
        setDatabaseStatus({
          status: "ready",
          message: "데이터베이스가 정상적으로 설정되었습니다!",
          data: dbStatus.data,
        })
      } else {
        setDatabaseStatus({
          status: "needs-setup",
          message: "테이블은 존재하지만 초기 데이터가 필요합니다.",
        })
      }
    } catch (err: any) {
      console.error("❌ 데이터베이스 확인 실패:", err)
      setDatabaseStatus({
        status: "needs-setup",
        message: "데이터베이스 설정이 필요합니다.",
        details: err.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert("클립보드에 복사되었습니다!")
    } catch (err) {
      console.error("클립보드 복사 실패:", err)
    }
  }

  useEffect(() => {
    checkDatabase()
  }, [])

  const migrationScript = `-- 🚀 Safe Pass v77 완전 마이그레이션 스크립트
-- Supabase SQL Editor에서 실행하세요

-- 기존 데이터 완전 삭제 및 새로 설정
-- (위의 complete-fresh-migration.sql 내용 전체)`

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Safe Pass v77 데이터베이스 설정</h1>
        <p className="text-gray-600">Supabase 마이그레이션 및 초기 설정을 진행합니다</p>
      </div>

      {/* 상태 확인 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            데이터베이스 연결 상태
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={checkDatabase} disabled={isLoading} className="flex-1">
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "확인 중..." : "데이터베이스 상태 확인"}
            </Button>
          </div>

          {databaseStatus.status === "checking" && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{databaseStatus.message}</AlertDescription>
            </Alert>
          )}

          {databaseStatus.status === "ready" && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription>
                <span className="text-green-700 font-semibold">✅ {databaseStatus.message}</span>
                <br />
                {stats && (
                  <div className="mt-2 text-sm text-green-600">
                    현재 상태: 대기 {stats.pending}명, 승인 {stats.approved}명, 완료 {stats.completed}명, 반려{" "}
                    {stats.rejected}명
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {databaseStatus.status === "needs-setup" && (
            <Alert className="border-orange-500 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <AlertDescription>
                <span className="text-orange-700 font-semibold">⚠️ {databaseStatus.message}</span>
                <br />
                {databaseStatus.details && (
                  <div className="mt-1 text-xs text-orange-600">오류: {databaseStatus.details}</div>
                )}
                <div className="mt-2 text-sm text-orange-600">아래 마이그레이션 스크립트를 실행해주세요.</div>
              </AlertDescription>
            </Alert>
          )}

          {databaseStatus.status === "error" && (
            <Alert className="border-red-500 bg-red-50">
              <XCircle className="h-4 w-4 text-red-500" />
              <AlertDescription>
                <span className="text-red-700 font-semibold">❌ {databaseStatus.message}</span>
                <br />
                {databaseStatus.details && (
                  <div className="mt-1 text-xs text-red-600">상세: {databaseStatus.details}</div>
                )}
                <div className="mt-2 text-sm text-red-600">Supabase 환경변수 설정을 확인해주세요.</div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 마이그레이션 가이드 */}
      {(databaseStatus.status === "needs-setup" || databaseStatus.status === "error") && (
        <Card className="border-blue-500">
          <CardHeader>
            <CardTitle className="text-blue-700 flex items-center gap-2">
              <Database className="h-5 w-5" />🚀 v77 Supabase 마이그레이션 가이드
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* 1단계 */}
              <div>
                <h4 className="font-semibold mb-3 text-lg">1️⃣ Supabase 대시보드 접속</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    <a
                      href="https://supabase.com/dashboard"
                      target="_blank"
                      className="text-blue-600 hover:underline font-medium"
                      rel="noreferrer"
                    >
                      https://supabase.com/dashboard
                    </a>
                  </div>
                  <p className="text-sm text-gray-600">• 프로젝트 선택 → 왼쪽 메뉴에서 "SQL Editor" 클릭</p>
                </div>
              </div>

              {/* 2단계 */}
              <div>
                <h4 className="font-semibold mb-3 text-lg">2️⃣ 마이그레이션 스크립트 실행</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <p className="text-sm text-gray-700">• "New query" 버튼 클릭</p>
                  <p className="text-sm text-gray-700">• 아래 스크립트를 복사하여 SQL Editor에 붙여넣기</p>
                  <p className="text-sm text-gray-700">• "Run" 버튼 클릭 (또는 Ctrl+Enter)</p>

                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">마이그레이션 스크립트:</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          copyToClipboard(`-- 🚀 Safe Pass v77 완전 마이그레이션 스크립트
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요
-- 기존 데이터를 모두 삭제하고 v77 구조로 새로 생성합니다

-- 1. 기존 정책 및 테이블 삭제
DROP POLICY IF EXISTS "Allow anonymous access to access_logs" ON access_logs;
DROP POLICY IF EXISTS "Allow anonymous access to admins" ON admins;
DROP POLICY IF EXISTS "Allow anonymous access to users" ON users;
DROP POLICY IF EXISTS "Allow anonymous access to construction_plans" ON construction_plans;
DROP POLICY IF EXISTS "Enable update access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert access for all users" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON construction_plans;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON admins;

DROP TABLE IF EXISTS access_logs CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS construction_plans CASCADE;

-- 2. v77 기준 테이블 생성
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

CREATE TABLE admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE access_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  entry_time TIMESTAMP WITH TIME ZONE,
  exit_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 인덱스 생성
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_construction_plan ON users(construction_plan_id);
CREATE INDEX idx_construction_plans_status ON construction_plans(status);
CREATE INDEX idx_access_logs_user_id ON access_logs(user_id);

-- 4. RLS 설정
ALTER TABLE construction_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- 5. 공개 접근 정책
CREATE POLICY "Enable read access for all users" ON construction_plans FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON construction_plans FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON construction_plans FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON construction_plans FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON users FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON users FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON users FOR DELETE USING (true);

CREATE POLICY "Enable read access for authenticated users" ON admins FOR SELECT USING (true);
CREATE POLICY "Enable all access for access_logs" ON access_logs FOR ALL USING (true);

-- 6. 초기 데이터 삽입
INSERT INTO construction_plans (title, description, company, start_date, end_date, site_manager, status) VALUES
('A동 전기공사', 'A동 전기설비 교체 및 보수공사', '(주)한국전기공사', '2024-02-01', '2024-03-31', '김현장', 'ongoing'),
('B동 배관공사', 'B동 급수배관 교체공사', '(주)대한배관', '2024-02-15', '2024-04-15', '이현장', 'planned'),
('C동 도장공사', 'C동 외벽 도장 및 방수공사', '(주)미래도장', '2024-03-01', '2024-05-01', '정현장', 'planned');

INSERT INTO admins (username, password) VALUES
('123', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

INSERT INTO users (name, phone, nationality, passport_number, birth_date, gender, construction_plan_id, roles, vehicle_info, status) VALUES
('김근로자', '010-1234-5678', 'KR', NULL, '1990-01-01', 'male', 1, '{"site_manager": true, "vehicle_owner": false}', NULL, 'pending'),
('John Smith', '010-9876-5432', 'US', 'P123456789', '1985-05-15', 'male', 2, '{"site_manager": false, "vehicle_owner": true}', '{"number": "12가3456", "type": "승용차"}', 'approved');

-- 7. 완료 확인
SELECT 
    '🎉 Safe Pass v77 마이그레이션 완료!' as status,
    (SELECT COUNT(*) FROM construction_plans) as construction_plans_count,
    (SELECT COUNT(*) FROM users) as users_count,
    (SELECT COUNT(*) FROM admins) as admins_count;`)
                        }
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        복사
                      </Button>
                    </div>
                    <div className="bg-gray-900 text-green-700 p-4 rounded-lg text-xs font-mono max-h-40 overflow-y-auto">
                      <pre>{`-- 🚀 Safe Pass v77 완전 마이그레이션 스크립트
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요
-- 기존 데이터를 모두 삭제하고 v77 구조로 새로 생성합니다

DROP TABLE IF EXISTS access_logs CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS construction_plans CASCADE;

-- v77 기준 테이블 생성...
-- (전체 스크립트는 복사 버튼을 클릭하세요)`}</pre>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3단계 */}
              <div>
                <h4 className="font-semibold mb-3 text-lg">3️⃣ 실행 결과 확인</h4>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-700 mb-2">성공 시 다음과 같은 메시지가 표시됩니다:</p>
                  <div className="bg-white p-3 rounded border text-xs font-mono">
                    <div className="text-green-600">🎉 Safe Pass v77 마이그레이션 완료!</div>
                    <div>construction_plans_count: 3</div>
                    <div>users_count: 2</div>
                    <div>admins_count: 1</div>
                  </div>
                </div>
              </div>

              {/* 4단계 */}
              <div className="pt-4 border-t">
                <Button
                  onClick={checkDatabase}
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                  마이그레이션 완료 후 다시 확인
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 환경변수 설정 가이드 */}
      {databaseStatus.status === "error" && (
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle className="text-red-700">🔧 Supabase 환경변수 설정</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">필수 환경변수</h4>
                <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                  <p>NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co</p>
                  <p>NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">설정 방법</h4>
                <div className="bg-gray-100 p-3 rounded text-sm">
                  <p>• Supabase 프로젝트 → Settings → API</p>
                  <p>• Project URL과 anon public key를 복사</p>
                  <p>• .env.local 파일에 환경변수 추가</p>
                  <p>• 서버 재시작</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 설정 완료 */}
      {databaseStatus.status === "ready" && (
        <Card className="border-green-500 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-700">🎉 v77 마이그레이션 완료!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-green-700">Safe Pass v77이 Supabase에 성공적으로 마이그레이션되었습니다!</p>

              {stats && (
                <div className="bg-white p-4 rounded border">
                  <h4 className="font-semibold mb-2">현재 시스템 상태</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
                      <div className="text-gray-600">대기중</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                      <div className="text-gray-600">승인됨</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
                      <div className="text-gray-600">완료됨</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                      <div className="text-gray-600">반려됨</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <Link href="/admin/dashboard">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    <Database className="w-4 h-4 mr-2" />
                    관리자 대시보드
                  </Button>
                </Link>
                <Link href="/admin/applications">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    신청 관리
                  </Button>
                </Link>
                <Link href="/registration">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    출입 신청
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 추가 정보 */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">📋 v77 주요 변경사항</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-blue-700">
            <p>• ✅ 완전한 Supabase 통합</p>
            <p>• ✅ v77 기준 테이블 구조</p>
            <p>• ✅ 익명 사용자 접근 허용</p>
            <p>• ✅ 실시간 데이터 동기화</p>
            <p>• ✅ 강화된 에러 처리</p>
            <p>• ✅ 관리자 계정: 123/123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
