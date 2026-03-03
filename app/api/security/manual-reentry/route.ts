import { type NextRequest, NextResponse } from "next/server"
import { getUserById, getUserLatestAccessLog, supabase } from "@/lib/supabase-storage"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    console.log("[v0] 수동 재출근처리 요청:", { userId })

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

    if (!latestLog || !latestLog.entry_time || !latestLog.exit_time) {
      return NextResponse.json(
        {
          success: false,
          error: "재출근처리할 수 없습니다. 퇴근 기록이 없습니다.",
        },
        { status: 400 },
      )
    }

    // Create new entry log for re-entry
    const now = new Date()

    console.log("[v0] 현재 UTC 시간:", now.toISOString())
    console.log("[v0] 한국 시간 (표시용):", now.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }))

    const { error } = await supabase.from("access_logs").insert([
      {
        user_id: userId,
        entry_time: now.toISOString(),
        exit_time: null,
      },
    ])

    if (error) {
      console.error("[v0] 재출근 기록 생성 실패:", error)
      return NextResponse.json(
        {
          success: false,
          error: "재출근 기록 생성에 실패했습니다",
        },
        { status: 500 },
      )
    }

    console.log("[v0] 수동 재출근처리 완료:", user.name)

    return NextResponse.json({
      success: true,
      message: `${user.name}님의 재출근처리가 완료되었습니다`,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
      },
    })
  } catch (error) {
    console.error("[v0] 수동 재출근처리 실패:", error)
    return NextResponse.json(
      {
        success: false,
        error: "재출근처리 중 오류가 발생했습니다",
      },
      { status: 500 },
    )
  }
}
