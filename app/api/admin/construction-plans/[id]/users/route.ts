import { NextRequest, NextResponse } from 'next/server'
import { getUsersByConstructionPlan } from '@/lib/supabase-storage'

/**
 * 특정 공사계획에 속한 사용자 목록 조회 API
 * GET /api/admin/construction-plans/[id]/users
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

    console.log(`🔍 공사계획 ID ${constructionPlanId}에 속한 사용자 목록 조회 요청`)

    const users = await getUsersByConstructionPlan(constructionPlanId)

    return NextResponse.json({
      success: true,
      count: users.length,
      users
    })
  } catch (error) {
    console.error('공사계획별 사용자 조회 오류:', error)
    return NextResponse.json(
      { error: '공사계획별 사용자 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
