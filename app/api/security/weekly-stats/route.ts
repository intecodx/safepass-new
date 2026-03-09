import { type NextRequest, NextResponse } from "next/server"
import { getAccessLogsRange } from "@/lib/supabase-storage"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const now = new Date()
    const koreaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }))

    // 7일 전부터 오늘까지
    const endDate = koreaTime.toISOString().split("T")[0]
    const startDate = new Date(koreaTime)
    startDate.setDate(startDate.getDate() - 6)
    const startDateStr = startDate.toISOString().split("T")[0]

    const logs = await getAccessLogsRange(startDateStr, endDate)

    // 날짜별로 그룹핑 (KST 기준)
    const dailyStats: Record<string, { entry: number; exit: number }> = {}

    // 7일간 날짜 초기화
    for (let i = 6; i >= 0; i--) {
      const d = new Date(koreaTime)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split("T")[0]
      dailyStats[key] = { entry: 0, exit: 0 }
    }

    // 유저별 최신 로그만 날짜별로 카운트
    const logsByDate = new Map<string, Map<number, any>>()

    logs.forEach((log) => {
      const logDate = new Date(new Date(log.created_at).toLocaleString("en-US", { timeZone: "Asia/Seoul" }))
        .toISOString()
        .split("T")[0]

      if (!logsByDate.has(logDate)) {
        logsByDate.set(logDate, new Map())
      }
      const dateMap = logsByDate.get(logDate)!
      // 유저당 첫 로그만 (이미 created_at desc로 정렬됨)
      if (!dateMap.has(log.user_id)) {
        dateMap.set(log.user_id, log)
      }
    })

    logsByDate.forEach((userLogs, date) => {
      if (dailyStats[date]) {
        userLogs.forEach((log) => {
          if (log.entry_time) dailyStats[date].entry++
          if (log.exit_time) dailyStats[date].exit++
        })
      }
    })

    return NextResponse.json(dailyStats)
  } catch (error) {
    console.error("주간 통계 조회 실패:", error)
    return NextResponse.json({ error: "주간 통계 조회 실패" }, { status: 500 })
  }
}
