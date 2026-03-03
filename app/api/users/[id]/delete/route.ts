import { type NextRequest, NextResponse } from "next/server"
import { deleteUser } from "@/lib/supabase-storage"

export const dynamic = "force-dynamic"
export const revalidate = 0

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = Number.parseInt(params.id)

    if (isNaN(userId)) {
      return NextResponse.json({ error: "유효하지 않은 사용자 ID입니다." }, { status: 400, headers: noStoreHeaders })
    }

    console.log(`[v0] 사용자 삭제 요청: ID ${userId}`)

    await deleteUser(userId)

    console.log(`[v0] 사용자 삭제 완료: ID ${userId}`)

    return NextResponse.json(
      {
        success: true,
        message: "신청이 성공적으로 삭제되었습니다.",
      },
      { headers: noStoreHeaders },
    )
  } catch (error) {
    console.error("[v0] 사용자 삭제 실패:", error)
    return NextResponse.json({ error: "삭제 중 오류가 발생했습니다." }, { status: 500, headers: noStoreHeaders })
  }
}
