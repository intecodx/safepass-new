import { type NextRequest, NextResponse } from "next/server"
import { getUserById, getUserLatestAccessLog, updateAccessLogWithExit } from "@/lib/supabase-storage"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    console.log("[v0] WIE 수동 퇴근처리 요청:", { userId })

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "사용자 ID가 필요합니다",
        },
        { status: 400 },
      )
    }

    // Get user information from database
    const user = await getUserById(userId)
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "등록되지 않은 사용자입니다",
        },
        { status: 404 },
      )
    }

    // Check if user is approved
    if (user.status !== "approved") {
      return NextResponse.json(
        {
          success: false,
          error: `승인되지 않은 사용자입니다 (현재 상태: ${user.status})`,
        },
        { status: 403 },
      )
    }

    // Get latest access log
    const latestLog = await getUserLatestAccessLog(userId)

    if (!latestLog || !latestLog.entry_time || latestLog.exit_time) {
      return NextResponse.json(
        {
          success: false,
          error: "퇴근처리할 수 없습니다. 출입 기록이 없거나 이미 퇴근처리되었습니다.",
        },
        { status: 400 },
      )
    }

    // Update existing log with exit time
    await updateAccessLogWithExit(latestLog.id)
    console.log("[v0] WIE 수동 퇴근처리 완료:", user.name)

    return NextResponse.json(
      {
        success: true,
        message: `${user.name}님의 퇴근처리가 완료되었습니다`,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    )
  } catch (error) {
    console.error("[v0] WIE 수동 퇴근처리 실패:", error)
    return NextResponse.json(
      {
        success: false,
        error: "퇴근처리 중 오류가 발생했습니다",
      },
      { status: 500 },
    )
  }
}
