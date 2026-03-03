import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * Supabase 연결 테스트 API
 * GET /api/test-supabase
 */
export async function GET() {
  try {
    console.log('🔍 Supabase 연결 테스트 시작...')
    
    // 환경변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('환경변수 확인:')
    console.log('- SUPABASE_URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : '없음')
    console.log('- SUPABASE_KEY:', supabaseKey ? `${supabaseKey.substring(0, 30)}...` : '없음')
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase 환경변수가 설정되지 않았습니다.',
        details: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey
        }
      }, { status: 500 })
    }

    // 테이블 존재 확인
    const { data: tables, error: tablesError } = await supabase
      .from('construction_plans')
      .select('count')
      .limit(1)

    if (tablesError) {
      console.error('❌ 테이블 접근 실패:', tablesError)
      return NextResponse.json({
        success: false,
        error: 'Supabase 테이블에 접근할 수 없습니다.',
        details: tablesError.message
      }, { status: 500 })
    }

    // 실제 데이터 조회 테스트
    const { data: plans, error: plansError } = await supabase
      .from('construction_plans')
      .select('*')
      .limit(5)

    if (plansError) {
      console.error('❌ 데이터 조회 실패:', plansError)
      return NextResponse.json({
        success: false,
        error: '데이터 조회에 실패했습니다.',
        details: plansError.message
      }, { status: 500 })
    }

    console.log('✅ Supabase 연결 성공!')
    console.log(`✅ 공사계획 ${plans?.length || 0}개 조회됨`)

    return NextResponse.json({
      success: true,
      message: 'Supabase 연결이 성공적으로 확인되었습니다.',
      data: {
        connectionStatus: 'success',
        tableExists: true,
        planCount: plans?.length || 0,
        samplePlans: plans?.slice(0, 3) || []
      }
    })

  } catch (error: any) {
    console.error('❌ Supabase 연결 테스트 실패:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Supabase 연결 테스트 중 오류가 발생했습니다.',
      details: error.message
    }, { status: 500 })
  }
}
