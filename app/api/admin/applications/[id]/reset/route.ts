import { type NextRequest, NextResponse } from "next/server"
import { updateUserStatus } from "@/lib/supabase-storage"

export const dynamic = "force-dynamic"
export const revalidate = 0

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const applicationId = Number.parseInt(params.id)

    // 사용자 상태를 승인대기로 되돌리기
    const updatedUser = await updateUserStatus(applicationId, "pending")

    if (!updatedUser) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404, headers: noStoreHeaders })
    }

    console.log(`승인대기로 되돌리기 완료: ID ${applicationId}`)

    return NextResponse.json(
      {
        success: true,
        message: "승인대기 상태로 되돌렸습니다.",
      },
      { headers: noStoreHeaders },
    )
  } catch (error) {
    console.error("상태 되돌리기 실패:", error)
    return NextResponse.json(
      { error: "상태 되돌리기 중 오류가 발생했습니다." },
      { status: 500, headers: noStoreHeaders },
    )
  }
}
