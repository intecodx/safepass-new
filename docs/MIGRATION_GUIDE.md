# Safe Pass 시스템 Supabase 마이그레이션 가이드

## 📋 개요

이 가이드는 Safe Pass 출입 관리 시스템을 Supabase 데이터베이스에 완전히 마이그레이션하는 방법을 설명합니다.

## 🚀 마이그레이션 단계

### 1단계: Supabase 프로젝트 준비

1. [Supabase 대시보드](https://supabase.com/dashboard) 접속
2. 프로젝트 선택 또는 새 프로젝트 생성
3. **SQL Editor** 메뉴로 이동

### 2단계: 데이터베이스 마이그레이션 실행

1. `scripts/complete-supabase-migration.sql` 파일 내용 복사
2. Supabase SQL Editor에 붙여넣기
3. **Run** 버튼 클릭하여 실행
4. 성공 메시지 확인:
   ```
   🎉 Safe Pass 시스템 Supabase 마이그레이션 완료!
   construction_plans_count: 5
   users_count: 13
   admins_count: 2
   access_logs_count: 12
   ```

### 3단계: 마이그레이션 검증

Node.js 환경에서 검증 스크립트 실행:

```bash
# 환경변수 설정
export NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"

# 검증 스크립트 실행
node scripts/verify-migration.js
```

## 📊 생성되는 데이터

### 테이블 구조

| 테이블명 | 설명 | 레코드 수 |
|---------|------|----------|
| `construction_plans` | 공사계획 정보 | 5개 |
| `users` | 사용자 정보 | 13명 |
| `admins` | 관리자 계정 | 2개 |
| `access_logs` | 출입 기록 | 12건 |

### 샘플 데이터

#### 공사계획 (5개)
- 전기설비 정비공사
- 배관 교체공사  
- 도장 보수공사
- 리모델링 공사
- 포장 공사

#### 사용자 (13명)
- 다양한 직종: 현장관리자, 기사, 일반근로자
- 다양한 회사: 대한전기공사, 한국배관, 코리아페인트 등
- 외국인 근로자 포함 (Michael Smith, Nguyen Van A)
- 승인/대기/거부 상태 다양하게 분포

#### 관리자 계정 (2개)
- `123` / `123` (시스템관리자)
- `admin` / `123` (안전관리자)

## 🔧 주요 기능

### 자동 생성 기능
- **QR 코드**: 사용자 등록 시 자동 생성
- **타임스탬프**: 생성/수정 시간 자동 기록

### 보안 설정
- **RLS (Row Level Security)** 활성화
- 익명 사용자 접근 정책 설정
- 데이터 무결성 제약조건

### 성능 최적화
- 주요 필드 인덱스 생성
- 검색 성능 향상
- 통계 조회 뷰 제공

### 편의 기능
- 사용자 상태 업데이트 함수
- 출입 기록 추가 함수
- 통계 조회 뷰

## 🧪 테스트 시나리오

### 1. 관리자 로그인 테스트
```
URL: /admin/login
계정: 123 / 123 또는 admin / 123
```

### 2. 대시보드 확인
```
URL: /admin/dashboard
확인사항: 통계 데이터, 차트, 최근 활동
```

### 3. 사용자 등록 테스트
```
URL: /registration
테스트: 새 사용자 등록 및 QR 코드 생성
```

### 4. 출입 관리 테스트
```
URL: /admin/applications
테스트: 승인/거부, 상태 변경
```

### 5. QR 스캔 테스트
```
URL: /qr-scanner
테스트: QR 코드 스캔 및 출입 기록
```

## ❗ 문제 해결

### 마이그레이션 실패 시

1. **권한 오류**
   ```sql
   -- RLS 정책 확인
   SELECT * FROM pg_policies WHERE tablename = 'users';
   ```

2. **테이블 존재 오류**
   ```sql
   -- 기존 테이블 삭제 후 재실행
   DROP TABLE IF EXISTS access_logs CASCADE;
   DROP TABLE IF EXISTS users CASCADE;
   DROP TABLE IF EXISTS construction_plans CASCADE;
   DROP TABLE IF EXISTS admins CASCADE;
   ```

3. **데이터 타입 오류**
   - 스크립트 전체를 다시 복사하여 실행
   - 특수문자나 인코딩 문제 확인

### 연결 오류 시

1. **환경변수 확인**
   ```bash
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

2. **Supabase 프로젝트 상태 확인**
   - 프로젝트가 활성 상태인지 확인
   - API 키가 올바른지 확인

3. **네트워크 연결 확인**
   - 방화벽 설정 확인
   - VPN 연결 상태 확인

## 📈 성능 모니터링

### 쿼리 성능 확인
```sql
-- 느린 쿼리 확인
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

### 인덱스 사용률 확인
```sql
-- 인덱스 사용 통계
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

## 🔄 백업 및 복구

### 데이터 백업
```sql
-- 전체 데이터 백업 (CSV 형태)
COPY (SELECT * FROM users) TO '/tmp/users_backup.csv' WITH CSV HEADER;
COPY (SELECT * FROM construction_plans) TO '/tmp/plans_backup.csv' WITH CSV HEADER;
```

### 데이터 복구
```sql
-- CSV에서 데이터 복구
COPY users FROM '/tmp/users_backup.csv' WITH CSV HEADER;
COPY construction_plans FROM '/tmp/plans_backup.csv' WITH CSV HEADER;
```

## 📞 지원

문제가 지속될 경우:

1. **Supabase 문서**: https://supabase.com/docs
2. **커뮤니티 지원**: https://github.com/supabase/supabase/discussions
3. **이슈 리포트**: 프로젝트 GitHub 저장소

---

**마이그레이션 완료 후 Safe Pass 시스템을 안전하고 효율적으로 사용하실 수 있습니다! 🎉**
