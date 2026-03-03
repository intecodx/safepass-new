import { NextRequest, NextResponse } from 'next/server'
import { getConstructionPlanStatistics } from '@/lib/supabase-storage'

/**
 * 특정 공사계획의 상세 통계 조회 API
 * GET /api/admin/construction-plans/[id]/statistics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const constructionPlanId = parseInt(params.id)

    if (isNaN(constructionPlanId)) {
      return NextResponse.json(
        { error: '올바르지 않은 공사계획 ID입니다.' },
        { status: 400 }
      )
    }

    console.log(`🔍 공사계획 ID ${constructionPlanId} 통계 조회 요청`)

    const statistics = await getConstructionPlanStatistics(constructionPlanId)

    if (!statistics) {
      return NextResponse.json(
        { error: '공사계획을 찾을 수 없거나 통계 조회에 실패했습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json(statistics)
  } catch (error) {
    console.error('공사계획 통계 조회 오류:', error)
    return NextResponse.json(
      { error: '공사계획 통계 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
