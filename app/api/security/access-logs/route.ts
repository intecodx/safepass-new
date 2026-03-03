import { NextResponse } from "next/server"
import { getAccessLogs } from "@/lib/supabase-storage"

export const dynamic = "force-dynamic"
export const revalidate = 0

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

export async function GET() {
  try {
    const logs = await getAccessLogs()

    // Get current date in Korea timezone
    const now = new Date()
    const koreaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }))
    const today = koreaTime.toISOString().split("T")[0] // YYYY-MM-DD format

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

    // Determine current status for each user based on today's logs
    userLogs.forEach((userLogList, userId) => {
      // Filter today's logs only
      const todayLogs = userLogList.filter((log) => {
        const logDate = new Date(log.entry_time || log.timestamp).toISOString().split("T")[0]
        return logDate === today
      })

      if (todayLogs.length === 0) {
        // No logs today - status is "미출입"
        userStatusMap.set(userId, "not_entered")
      } else {
        // Sort by timestamp to get the latest status
        todayLogs.sort((a, b) => {
          const timeA = new Date(a.entry_time || a.timestamp).getTime()
          const timeB = new Date(b.entry_time || b.timestamp).getTime()
          return timeB - timeA // Latest first
        })

        const latestLog = todayLogs[0]
        if (latestLog.exit_time) {
          // Has exit time - status is "퇴근완료"
          userStatusMap.set(userId, "work_completed")
        } else if (latestLog.entry_time || latestLog.timestamp) {
          // Has entry but no exit - status is "출근완료"
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
