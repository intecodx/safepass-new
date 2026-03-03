// Supabase 마이그레이션 검증 스크립트
// Node.js 환경에서 실행

import { createClient } from '@supabase/supabase-js'

// Supabase 설정 (환경변수에서 가져오기)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyMigration() {
  console.log('🔍 Safe Pass 시스템 마이그레이션 검증 시작...\n')

  try {
    // 1. 테이블 존재 확인 및 데이터 개수 체크
    const tables = [
      'construction_plans',
      'users', 
      'admins',
      'access_logs'
    ]

    const results = {}

    for (const table of tables) {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.error(`❌ ${table} 테이블 오류:`, error.message)
        results[table] = { success: false, count: 0, error: error.message }
      } else {
        console.log(`✅ ${table}: ${count}개 레코드`)
        results[table] = { success: true, count: count || 0 }
      }
    }

    // 2. 관리자 계정 확인
    console.log('\n🔐 관리자 계정 확인...')
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('username, name, role')

    if (adminError) {
      console.error('❌ 관리자 계정 조회 실패:', adminError.message)
    } else {
      adminData?.forEach(admin => {
        console.log(`✅ 관리자: ${admin.username} (${admin.name}) - ${admin.role}`)
      })
    }

    // 3. 공사계획 확인
    console.log('\n🏗️ 공사계획 확인...')
    const { data: planData, error: planError } = await supabase
      .from('construction_plans')
      .select('name, status, start_date, end_date')

    if (planError) {
      console.error('❌ 공사계획 조회 실패:', planError.message)
    } else {
      planData?.forEach(plan => {
        console.log(`✅ ${plan.name} (${plan.status}): ${plan.start_date} ~ ${plan.end_date}`)
      })
    }

    // 4. 사용자 상태별 통계
    console.log('\n👥 사용자 상태별 통계...')
    const { data: userStats, error: userStatsError } = await supabase
      .from('users')
      .select('status')

    if (userStatsError) {
      console.error('❌ 사용자 통계 조회 실패:', userStatsError.message)
    } else {
      const statusCount = userStats?.reduce((acc, user) => {
        acc[user.status] = (acc[user.status] || 0) + 1
        return acc
      }, {})
      
      Object.entries(statusCount || {}).forEach(([status, count]) => {
        console.log(`✅ ${status}: ${count}명`)
      })
    }

    // 5. 최근 출입 기록 확인
    console.log('\n📊 최근 출입 기록 확인...')
    const { data: recentLogs, error: logsError } = await supabase
      .from('access_logs')
      .select(`
        id,
        action,
        timestamp,
        users (name, company)
      `)
      .order('timestamp', { ascending: false })
      .limit(5)

    if (logsError) {
      console.error('❌ 출입 기록 조회 실패:', logsError.message)
    } else {
      recentLogs?.forEach(log => {
        const userName = log.users?.name || '알 수 없음'
        const company = log.users?.company || ''
        const timestamp = new Date(log.timestamp).toLocaleString('ko-KR')
        console.log(`✅ ${userName} (${company}) - ${log.action} at ${timestamp}`)
      })
    }

    // 6. 전체 결과 요약
    console.log('\n📋 마이그레이션 검증 결과 요약:')
    console.log('=' .repeat(50))
    
    let allSuccess = true
    Object.entries(results).forEach(([table, result]) => {
      const status = result.success ? '✅' : '❌'
      console.log(`${status} ${table}: ${result.count}개`)
      if (!result.success) {
        allSuccess = false
        console.log(`   오류: ${result.error}`)
      }
    })

    if (allSuccess) {
      console.log('\n🎉 모든 테이블이 성공적으로 마이그레이션되었습니다!')
      console.log('🚀 Safe Pass 시스템을 사용할 준비가 완료되었습니다.')
      console.log('\n📝 다음 단계:')
      console.log('1. /admin/login 페이지에서 관리자 로그인 (123/123)')
      console.log('2. /admin/dashboard 에서 시스템 상  /admin/login 페이지에서 관리자 로그인 (123/123)')
      console.log('2. /admin/dashboard 에서 시스템 상태 확인')
      console.log('3. /registration 페이지에서 사용자 등록 테스트')
      console.log('4. QR 코드 스캔 기능 테스트')
    } else {
      console.log('\n❌ 일부 테이블에서 문제가 발견되었습니다.')
      console.log('🔧 Supabase SQL Editor에서 마이그레이션 스크립트를 다시 실행해주세요.')
    }

  } catch (error) {
    console.error('\n💥 검증 중 예상치 못한 오류 발생:', error.message)
    console.log('\n🔧 해결 방법:')
    console.log('1. Supabase 연결 정보 확인')
    console.log('2. 환경변수 설정 확인')
    console.log('3. 네트워크 연결 상태 확인')
  }
}

// 스크립트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyMigration()
}

export { verifyMigration }
