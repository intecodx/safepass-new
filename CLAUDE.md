# CLAUDE.md — SafePass 출입관리 시스템

## 프로젝트 개요

SafePass는 INTECO(인천종합에너지)와 WIE(위드인천에너지) 두 회사의 **안전출입 관리시스템**입니다.
방문자 등록 → 관리자 승인 → QR코드 발급 → 경비실 스캔까지 완전한 출입통제 체계를 구현합니다.

- **운영 URL**: https://safe-pass-inteco.vercel.app
- **배포**: Vercel (GitHub `intecodx/safepass-new` 연동, main 브랜치 자동 배포)
- **DB**: Supabase (PostgreSQL), 프로젝트 ref: `wqkmhgkzhdajoignutjm`

## 기술 스택

| 계층 | 기술 |
|------|------|
| 프레임워크 | Next.js 14.2.16 (App Router) |
| 언어 | TypeScript 5 |
| 스타일링 | Tailwind CSS 3.4 |
| UI | Shadcn/ui (Radix UI 기반), Lucide React 아이콘 |
| 폼/검증 | React Hook Form + Zod |
| DB | Supabase (PostgreSQL) |
| QR코드 | qrcode, html5-qrcode, @zxing/library |
| SMS | SOLAPI REST API |
| 주차관제 | 아마노 HTTP API (HTTP/1.0) |
| 차트 | Recharts |
| 배포 | Vercel |

## 빌드 & 실행

```bash
cd Downloads/safepass-new
npm install          # 또는 pnpm install
npm run dev          # 개발서버 (localhost:3000)
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 실행
```

**참고**: `next.config.mjs`에서 `ignoreBuildErrors: true`, `ignoreDuringBuilds: true` 설정 중.

## 환경변수 (`.env.local`)

```bash
# Supabase (필수)
NEXT_PUBLIC_SUPABASE_URL=https://wqkmhgkzhdajoignutjm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# SOLAPI SMS (SMS 발송 시 필수)
SOLAPI_API_KEY=
SOLAPI_API_SECRET=
SOLAPI_FROM_PHONE=

# 아마노 주차관제 (차량 등록 시 필수)
AMANO_API_URL=http://parking-system-ip:9948
AMANO_USER_ID=
AMANO_USER_PW=
AMANO_LOT_AREA=1
AMANO_DISC_CODE=0
```

**주의**: `.env.local`은 절대 커밋하지 말 것. 키 값은 Vercel 환경변수 또는 Supabase 대시보드에서 확인.

## 디렉토리 구조

```
safepass-new/
├── app/
│   ├── page.tsx                    # 홈페이지 (다국어)
│   ├── registration/               # 출입 신청
│   ├── status/                     # 신청 현황 조회
│   ├── safety-education/           # 안전교육
│   ├── verify/[id]/                # 인증 확인
│   ├── admin/                      # INTECO 관리자 포털
│   │   ├── login/                  # 로그인
│   │   ├── dashboard/              # 대시보드
│   │   ├── applications/           # 신청 승인/반려
│   │   ├── construction-plans/     # 공사계획 관리
│   │   ├── entry-status/           # 실시간 출입 현황
│   │   ├── statistics/             # 통계
│   │   └── qr-scanner/             # QR 스캔
│   ├── security/                   # INTECO 경비실
│   │   ├── dashboard/              # 경비 대시보드
│   │   └── qr-scanner/             # QR 스캔
│   ├── wie-admin/                  # WIE 관리자 (admin과 동일 구조)
│   ├── wie-security/               # WIE 경비실
│   └── api/                        # API 라우트
│       ├── admin/                  # INTECO 관리자 API
│       ├── security/               # INTECO 경비실 API
│       ├── wie-admin/              # WIE 관리자 API
│       ├── wie-security/           # WIE 경비실 API
│       ├── users/                  # 사용자 API
│       ├── sms/                    # SMS API
│       ├── construction-plans/     # 공사계획 API (공개)
│       └── verify-qr/              # QR 검증 API
├── components/
│   ├── ui/                         # Shadcn/ui 컴포넌트 (50+)
│   └── theme-provider.tsx
├── lib/
│   ├── supabase.ts                 # Supabase 클라이언트 초기화
│   ├── supabase-storage.ts         # DB 추상화 레이어 (핵심, 1200줄+)
│   ├── qr-service.ts               # QR코드 생성/검증
│   ├── sms-service.ts              # SOLAPI SMS 발송 (700줄+)
│   ├── amano-api.ts                # 아마노 주차관제 연동
│   └── utils.ts                    # 유틸리티
├── hooks/
│   ├── use-mobile.tsx              # 모바일 감지
│   └── use-toast.ts                # 토스트 알림
├── scripts/                        # SQL 마이그레이션 스크립트 (30개)
├── styles/globals.css              # Tailwind 글로벌 스타일
└── public/                         # 정적 파일
```

## 회사 구분 (INTECO vs WIE)

두 회사는 **같은 DB를 공유**하되, `company` 필드로 데이터를 분리합니다.

| 구분 | INTECO | WIE |
|------|--------|-----|
| 관리자 포털 | `/admin/` | `/wie-admin/` |
| 경비실 포털 | `/security/` | `/wie-security/` |
| API 경로 | `/api/admin/`, `/api/security/` | `/api/wie-admin/`, `/api/wie-security/` |
| 필터 조건 | `company !== "WIE"` | `company === "WIE"` |
| QR 검증 | `/api/verify-qr` | `/api/wie-security/verify-qr` |

## DB 스키마 (Supabase)

### `construction_plans` — 공사계획
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | SERIAL PK | |
| title | VARCHAR(255) | 공사명 |
| description | TEXT | 설명 |
| company | VARCHAR(255) | `'INTECO'` 또는 `'WIE'` |
| work_company | VARCHAR(255) | 시공사명 |
| start_date | DATE | 시작일 |
| end_date | DATE | 종료일 |
| site_manager | VARCHAR(100) | 현장관리자 |
| supervisor | VARCHAR(100) | 감리자 (선택) |
| status | VARCHAR(20) | `planned`, `ongoing`, `completed`, `cancelled` |
| created_at | TIMESTAMPTZ | |

### `users` — 사용자(신청자)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | SERIAL PK | |
| name | VARCHAR(100) | 성명 |
| phone | VARCHAR(20) UNIQUE | 연락처 |
| nationality | VARCHAR(10) | 국적 (`KR`, `CN`, `US` 등) |
| passport_number | VARCHAR(50) | 여권번호 (외국인) |
| birth_date | DATE | 생년월일 |
| gender | VARCHAR(10) | `male`, `female` |
| construction_plan_id | FK → construction_plans | |
| roles | JSONB | `{"site_manager": bool, "vehicle_owner": bool}` |
| vehicle_info | JSONB | `{"number": "12가3456", "type": "승용차"}` |
| status | VARCHAR(20) | `pending` → `approved` → `rejected` |
| qr_code_url | TEXT | QR코드 Data URL |
| created_at | TIMESTAMPTZ | |

### `access_logs` — 출입 기록
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | SERIAL PK | |
| user_id | FK → users | |
| entry_time | TIMESTAMPTZ | 입장시간 |
| exit_time | TIMESTAMPTZ | 퇴장시간 (NULL이면 재장 중) |
| created_at | TIMESTAMPTZ | |

### `admins` — 관리자 계정
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | SERIAL PK | |
| username | VARCHAR(50) UNIQUE | |
| password | VARCHAR(255) | |

## 핵심 기능 흐름

### 1. 출입 신청 (`/registration`)
1. 발주처 선택 (INTECO / WIE)
2. 공사계획 선택 (네이티브 select, 기간 표시)
3. 개인정보 입력 (성명, 연락처, 국적, 생년월일 등)
4. 외국인 → 여권번호, 차량소유자 → 차량정보
5. 이용약관 동의 → `/api/users/register` 호출
6. DB에 `status='pending'`으로 저장

### 2. 관리자 승인 (`/admin/applications`)
1. 관리자 로그인 (쿠키 세션, 24시간)
2. 대기 중인 신청 확인 후 "승인" 클릭
3. `/api/admin/applications/[id]/approve` 호출
4. `status='approved'` 업데이트
5. 차량소유자 → 아마노 API로 차량 자동 등록
6. SMS로 승인 알림 발송

### 3. QR코드 발급
- 승인 시 자동 생성 (`lib/qr-service.ts`)
- QR 데이터: `{ userId, userName, phone, approvedAt, expiresAt }`
- 유효기간: 공사계획 종료일 +1일

### 4. 경비실 스캔 (`/security/qr-scanner`)
1. QR 스캔 → `/api/verify-qr` 호출
2. 유효성 확인 (기간, 사용자, 공사계획)
3. `access_logs`에 `entry_time` 기록
4. 퇴장 시 재스캔 또는 수동 퇴장 (`/api/security/manual-exit`)

### 5. 경비실 대시보드 (`/security/dashboard`)
- 현재 현장 인원 / 금일 퇴근 인원 / 주간 통계
- 출입현황 테이블 (날짜/공사계획 필터)
- 수동 퇴근/재출근 처리
- 일자별 출입 차트 (7일간)
- **polling 간격: 5분** (Supabase egress 절감)

## 핵심 라이브러리 파일

### `lib/supabase-storage.ts` (가장 중요)
모든 DB CRUD가 여기에 있음. 50+ 함수:
- **사용자**: `getUsers()`, `addUser()`, `updateUserStatus()`, `findUserByPhone()` 등
- **공사계획**: `getConstructionPlans()`, `addConstructionPlan()` 등
- **출입기록**: `getAccessLogs(days?)`, `addEntryLog()`, `updateAccessLogWithExit()` 등
- **통계**: `getAccessStatistics()`, `getConstructionPlanStatistics()` 등

`getAccessLogs(days?)`는 `days` 파라미터로 최근 N일 데이터만 쿼리 가능 (기본: 전체).

### `lib/sms-service.ts`
SOLAPI 통합. SMS/LMS/MMS/알림톡/친구톡/국제SMS/대량발송/예약발송 지원.

### `lib/amano-api.ts`
아마노 주차관제 연동. HTTP/1.0 프로토콜 사용 (Node.js `http` 모듈).
승인된 차량을 자동 등록/삭제.

### `lib/qr-service.ts`
QR코드 생성 (300x300px Data URL) 및 유효기간 검증.

## 다국어 지원

| 언어 | 코드 | 적용 범위 |
|------|------|----------|
| 한국어 | `ko` | 전체 |
| 영어 | `en` | 홈, 출입 신청 |
| 중국어(간체) | `zh` | 홈, 출입 신청 |
| 일본어 | `ja` | 홈, 출입 신청 |

번역은 컴포넌트 내 `texts` 객체에 하드코딩. `localStorage`에 `safepass-language` 키로 저장.
관리자/경비실 페이지는 한국어만 지원.

## API 라우트 요약

### 관리자 (`/api/admin/`)
- `POST login/logout`, `GET check-auth` — 인증
- `GET applications` — 신청 목록
- `POST applications/[id]/approve|reject|delete` — 승인/반려/삭제
- `GET|POST construction-plans`, `GET|PUT|DELETE construction-plans/[id]` — 공사계획 CRUD
- `GET entry-status`, `GET statistics` — 현황/통계

### 경비실 (`/api/security/`)
- `GET access-logs` — 출입 기록 (최근 10일)
- `POST manual-exit`, `POST manual-reentry` — 수동 퇴장/재입장
- `GET weekly-stats` — 주간 통계

### 사용자 (`/api/users/`)
- `POST register` — 출입 신청
- `GET search`, `GET [id]` — 조회

### SMS (`/api/sms/`)
- `POST send-sms|send-lms|send-mms` — 문자 발송
- `POST send-alimtalk|send-friendtalk` — 카카오톡
- `POST send-many|send-scheduled` — 대량/예약

WIE 전용 API는 `/api/wie-admin/`, `/api/wie-security/` 경로에 동일 구조로 존재.

## 관리자 계정 (하드코딩 — 보안 개선 필요)

코드 내 `app/api/admin/login/route.ts`에 하드코딩되어 있음:
- INTECO 경비실: `safe2025` / `safe2025`
- INTECO 관리자: `gon2025` / `gon2025`
- WIE 관리자: `gon0412` / `gon0412`
- WIE 경비실: `pass2025` / `pass2025`

**주의**: 이 계정은 GitHub에 노출되어 있으므로 보안 개선이 필요합니다.

## 주의사항

- **운영 중인 시스템**: 오버홀 기간에 많은 사람이 사용하므로 main 브랜치 직접 수정 시 주의
- **dev 브랜치**: 테스트/개발은 dev 브랜치에서 진행 후 확인 완료 시 main 머지
- **Vercel 롤백**: 문제 발생 시 Vercel Dashboard → Deployments에서 이전 배포로 즉시 롤백 가능
- **Supabase 무료 플랜**: DB 500MB, Egress 5GB/월 한도. polling 간격과 쿼리 최적화 필수
- **패키지 버전**: 일부 패키지가 `"latest"`로 지정되어 있어 빌드 재현성 낮음
