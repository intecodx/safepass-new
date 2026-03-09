import { type NextRequest, NextResponse } from "next/server"
import { getAccessLogs } from "@/lib/supabase-storage"

export const dynamic = "force-dynamic"
export const revalidate = 0

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

export async function GET(request: NextRequest) {
  try {
    // Get current date in Korea timezone
    const { searchParams } = new URL(request.url)
    const now = new Date()
    const koreaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }))
    const today = searchParams.get("date") || koreaTime.toISOString().split("T")[0]

    const logs = await getAccessLogs(today)

    // Process logs to determine current status for each user
    const userStatusMap = new Map()

    // Group logs by user and process chronologically
    const userLogs = new Map()
    logs.forEach((log) => {
      if (!userLogs.has(log.user_id)) {
        userLogs.set(log.user_id, [])
      }
      userLogs.get(log.user_id).push(log)
    })

    // Determine current status for each user based on selected date's logs
    // (logs are already filtered by date from getAccessLogs)
    userLogs.forEach((userLogList, userId) => {
      if (userLogList.length === 0) {
        userStatusMap.set(userId, "not_entered")
      } else {
        // Sort by created_at to get the latest status
        userLogList.sort((a, b) => {
          const timeA = new Date(a.created_at).getTime()
          const timeB = new Date(b.created_at).getTime()
          return timeB - timeA // Latest first
        })

        const latestLog = userLogList[0]
        if (latestLog.exit_time) {
          userStatusMap.set(userId, "work_completed")
        } else if (latestLog.entry_time) {
          userStatusMap.set(userId, "work_started")
        } else {
          userStatusMap.set(userId, "not_entered")
        }
      }
    })

    // Add status information to logs
    const logsWithStatus = logs.map((log) => ({
      ...log,
      current_status: userStatusMap.get(log.user_id) || "not_entered",
    }))

    return NextResponse.json(logsWithStatus, { headers: noStoreHeaders })
  } catch (error) {
    console.error("출입 로그 조회 실패:", error)
    return NextResponse.json({ error: "출입 로그 조회 실패" }, { status: 500, headers: noStoreHeaders })
  }
}
