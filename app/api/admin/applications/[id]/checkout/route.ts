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

    // 사용자 상태를 퇴근완료로 업데이트 (QR코드 스캔으로 자동 처리)
    const updatedUser = await updateUserStatus(applicationId, "completed")

    if (!updatedUser) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404, headers: noStoreHeaders })
    }

    console.log(`QR코드 스캔으로 퇴근 처리 완료: ID ${applicationId}`)

    return NextResponse.json(
      {
        success: true,
        message: "QR코드 스캔으로 퇴근 처리가 완료되었습니다.",
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          phone: updatedUser.phone,
          checkout_time: new Date().toISOString(),
        },
      },
      { headers: noStoreHeaders },
    )
  } catch (error) {
    console.error("QR코드 퇴근 처리 실패:", error)
    return NextResponse.json({ error: "퇴근 처리 중 오류가 발생했습니다." }, { status: 500, headers: noStoreHeaders })
  }
}
