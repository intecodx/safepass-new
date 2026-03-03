import { type NextRequest, NextResponse } from "next/server"
import { updateUser } from "@/lib/supabase-storage"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = Number.parseInt(params.id)
    const updateData = await request.json()

    console.log(`사용자 ${userId} 정보 업데이트:`, updateData)

    if (updateData.construction_plan && typeof updateData.construction_plan === "object") {
      updateData.construction_plan_id = updateData.construction_plan.id
      delete updateData.construction_plan
    }

    const allowedFields = [
      "name",
      "phone",
      "nationality",
      "passport_number",
      "birth_date",
      "gender",
      "construction_plan_id",
      "roles",
      "vehicle_info",
      "status",
    ]

    const filteredUpdateData = Object.keys(updateData)
      .filter((key) => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key]
        return obj
      }, {} as any)

    console.log(`필터링된 업데이트 데이터:`, filteredUpdateData)

    const updatedUser = await updateUser(userId, filteredUpdateData)

    if (!updatedUser) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "정보가 성공적으로 수정되었습니다.",
      user: updatedUser,
    })
  } catch (error) {
    console.error("사용자 정보 수정 실패:", error)
    return NextResponse.json({ error: "수정 중 오류가 발생했습니다." }, { status: 500 })
  }
}
