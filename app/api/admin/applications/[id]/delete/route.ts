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
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "유효하지 않은 ID입니다." }, { status: 400, headers: noStoreHeaders })
    }

    console.log(`[v0] 사용자 삭제 요청: ID ${id}`)

    const result = await deleteUser(id)

    if (result.success) {
      console.log(`[v0] 사용자 삭제 성공: ID ${id}`)
      return NextResponse.json(
        {
          message: "사용자가 성공적으로 삭제되었습니다.",
          success: true,
        },
        { headers: noStoreHeaders },
      )
    } else {
      console.error(`[v0] 사용자 삭제 실패: ID ${id}, 오류:`, result.error)
      return NextResponse.json(
        { error: result.error || "사용자 삭제에 실패했습니다." },
        { status: 500, headers: noStoreHeaders },
      )
    }
  } catch (error) {
    console.error("[v0] 사용자 삭제 API 오류:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500, headers: noStoreHeaders })
  }
}
