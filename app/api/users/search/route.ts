import { type NextRequest, NextResponse } from "next/server"
import { findUserByPhone, findConstructionPlanById } from "@/lib/supabase-storage"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get("phone")

    if (!phone) {
      return NextResponse.json({ error: "전화번호가 필요합니다." }, { status: 400 })
    }

    const users = await findUserByPhone(phone)

    if (!users || users.length === 0) {
      return NextResponse.json({ error: "등록된 전화번호를 찾을 수 없습니다." }, { status: 404 })
    }

    // 각 사용자에 대해 공사계획 정보 추가
    const usersWithPlans = await Promise.all(
      users.map(async (user) => {
        const constructionPlan = user.construction_plan_id
          ? await findConstructionPlanById(user.construction_plan_id)
          : null

        return {
          ...user,
          construction_plan: constructionPlan
            ? {
                id: constructionPlan.id,
                title: constructionPlan.title,
                company: constructionPlan.company,
              }
            : null,
        }
      }),
    )

    // 단일 사용자인 경우 기존 형태로 반환, 여러 사용자인 경우 배열로 반환
    if (usersWithPlans.length === 1) {
      return NextResponse.json(usersWithPlans[0])
    } else {
      return NextResponse.json({ multiple: true, users: usersWithPlans })
    }
  } catch (error) {
    console.error("사용자 조회 실패:", error)
    return NextResponse.json({ error: "조회 중 오류가 발생했습니다." }, { status: 500 })
  }
}
