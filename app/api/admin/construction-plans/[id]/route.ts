import { NextResponse, type NextRequest } from "next/server"
import { updateConstructionPlan, deleteConstructionPlan } from "@/lib/supabase-storage"

// 공사계획 수정
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const planId = Number.parseInt(params.id)
    const updateData = await request.json()

    console.log(`공사계획 ${planId} 수정 요청:`, updateData)

    // 입력 검증
    if (updateData.start_date && updateData.end_date) {
      if (new Date(updateData.start_date) > new Date(updateData.end_date)) {
        return NextResponse.json({ error: "종료일은 시작일보다 이르면 안됩니다." }, { status: 400 })
      }
    }

    const updatedPlan = await updateConstructionPlan(planId, updateData)

    if (!updatedPlan) {
      return NextResponse.json({ error: "공사계획을 찾을 수 없습니다." }, { status: 404 })
    }

    return NextResponse.json({ success: true, plan: updatedPlan })
  } catch (error) {
    console.error("공사계획 수정 실패:", error)
    return NextResponse.json({ error: "공사계획 수정 중 오류가 발생했습니다." }, { status: 500 })
  }
}

// 공사계획 삭제
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const planId = Number.parseInt(params.id)

    console.log(`공사계획 ${planId} 삭제 요청`)

    const success = await deleteConstructionPlan(planId)

    if (!success) {
      return NextResponse.json(
        {
          error: "공사계획을 삭제할 수 없습니다. 연결된 사용자가 있는지 확인해주세요.",
        },
        { status: 400 },
      )
    }

    return NextResponse.json({ success: true, message: "공사계획이 삭제되었습니다." })
  } catch (error) {
    console.error("공사계획 삭제 실패:", error)
    return NextResponse.json({ error: "공사계획 삭제 중 오류가 발생했습니다." }, { status: 500 })
  }
}
