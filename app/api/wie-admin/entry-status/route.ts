import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-storage"

export const dynamic = "force-dynamic"
export const revalidate = 0

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

function getKSTDate(utcTimestamp: string): string {
  const date = new Date(utcTimestamp)
  const kstDateStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
  return kstDateStr // Returns YYYY-MM-DD in KST
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0]
    const constructionPlanFilter = searchParams.get("construction_plan")

    const now = new Date()
    const koreaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }))
    const requestedDate = new Date(`${date}T00:00:00`)
    const koreaRequestedDate = new Date(requestedDate.toLocaleString("en-US", { timeZone: "Asia/Seoul" }))

    const startDate = koreaRequestedDate.toISOString()
    const endDate = new Date(koreaRequestedDate.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString()

    const { data: applications, error: applicationsError } = await supabase
      .from("users")
      .select(`
        id,
        name,
        phone,
        status,
        blood_type,
        roles,
        vehicle_info,
        construction_plans!inner(title, work_company, status, company)
      `)
      .eq("status", "approved")
      .eq("construction_plans.company", "WIE")

    if (applicationsError) {
      console.error("Error fetching applications:", applicationsError)
      return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500, headers: noStoreHeaders })
    }

    const { data: accessLogs, error: logsError } = await supabase
      .from("access_logs")
      .select("user_id, entry_time, exit_time, created_at")
      .order("created_at", { ascending: false })

    if (logsError) {
      console.error("Error fetching access logs:", logsError)
      return NextResponse.json({ error: "Failed to fetch access logs" }, { status: 500, headers: noStoreHeaders })
    }

    const filteredAccessLogs =
      accessLogs?.filter((log) => {
        const entryDate = log.entry_time ? getKSTDate(log.entry_time) : null
        const exitDate = log.exit_time ? getKSTDate(log.exit_time) : null
        return entryDate === date || exitDate === date
      }) || []

    let entryData =
      applications?.map((app) => {
        const userAccessLog = filteredAccessLogs?.find((log) => log.user_id === app.id)
        const hasEntryLog = userAccessLog && userAccessLog.entry_time !== null
        const hasExitLog = userAccessLog && userAccessLog.exit_time !== null

        return {
          id: app.id,
          name: app.name,
          phone: app.phone,
          construction_plan_title: app.construction_plans?.title || "공사계획 미지정",
          construction_plan_status: app.construction_plans?.status || "planned",
          work_company: app.construction_plans?.work_company || "미지정",
          status: app.status,
          blood_type: app.blood_type,
          roles: app.roles,
          vehicle_info: app.vehicle_info,
          entry_time: userAccessLog?.entry_time || null,
          exit_time: userAccessLog?.exit_time || null,
          entryCompleted: hasEntryLog,
        }
      }) || []

    const constructionPlans = [
      ...new Set(applications?.map((app) => app.construction_plans?.title || "공사계획 미지정")),
    ].sort()

    if (constructionPlanFilter && constructionPlanFilter !== "all") {
      entryData = entryData.filter((entry) => entry.construction_plan_title === constructionPlanFilter)
    }

    entryData.sort((a, b) => {
      // If both have entry times, sort by entry time (latest first)
      if (a.entry_time && b.entry_time) {
        const aEntryTime = new Date(a.entry_time).getTime()
        const bEntryTime = new Date(b.entry_time).getTime()
        if (aEntryTime !== bEntryTime) {
          return bEntryTime - aEntryTime // Changed to descending order (latest first)
        }

        // If entry times are same, sort by exit time (latest first, null values last)
        if (a.exit_time && b.exit_time) {
          return new Date(b.exit_time).getTime() - new Date(a.exit_time).getTime() // Changed to descending order
        } else if (a.exit_time && !b.exit_time) {
          return -1 // a has exit time, b doesn't - a comes first
        } else if (!a.exit_time && b.exit_time) {
          return 1 // b has exit time, a doesn't - b comes first
        }
        return 0
      }

      // If only one has entry time, that one comes first
      if (a.entry_time && !b.entry_time) return -1
      if (!a.entry_time && b.entry_time) return 1

      // If neither has entry time, sort by name
      return a.name.localeCompare(b.name, "ko-KR")
    })

    const stats = {
      total: entryData.length,
      entered: entryData.filter((entry) => entry.entry_time && !entry.exit_time).length,
      exited: entryData.filter((entry) => entry.exit_time).length,
      not_entered: entryData.filter((entry) => !entry.entry_time).length,
    }

    return NextResponse.json(
      {
        entries: entryData,
        stats,
        date,
        constructionPlans,
      },
      { headers: noStoreHeaders },
    )
  } catch (error) {
    console.error("Error in entry-status API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: noStoreHeaders })
  }
}
