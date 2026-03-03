import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-storage"

export const dynamic = "force-dynamic"
export const revalidate = 0

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0]
    const constructionPlanFilter = searchParams.get("construction_plan")

    console.log("[v0] Fetching applications for date:", date)

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
        construction_plan_id,
        construction_plans!inner(title, work_company, status, company)
      `)
      .eq("status", "approved")
      .neq("construction_plans.company", "WIE")

    if (applicationsError) {
      console.error("[v0] Error fetching applications:", applicationsError)
      return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500, headers: noStoreHeaders })
    }

    console.log("[v0] Applications fetched:", applications?.length || 0)

    const { data: accessLogs, error: logsError } = await supabase
      .from("access_logs")
      .select("user_id, entry_time, exit_time, created_at")
      .order("created_at", { ascending: false })

    if (logsError) {
      console.error("[v0] Error fetching access logs:", logsError)
      return NextResponse.json({ error: "Failed to fetch access logs" }, { status: 500, headers: noStoreHeaders })
    }

    console.log("[v0] Access logs fetched:", accessLogs?.length || 0)

    let entryData =
      applications?.map((app: any) => {
        const constructionPlan = app.construction_plans

        // Find the latest access log for this user (already sorted by created_at desc)
        const userAccessLog = accessLogs?.find((log) => log.user_id === app.id)
        const hasEntryLog = userAccessLog && userAccessLog.entry_time !== null
        const hasExitLog = userAccessLog && userAccessLog.exit_time !== null

        return {
          id: app.id,
          name: app.name,
          phone: app.phone,
          construction_plan_title: constructionPlan?.title || "공사계획 미지정",
          construction_plan_status: constructionPlan?.status || "planned",
          work_company: constructionPlan?.work_company || "미지정",
          status: app.status,
          blood_type: app.blood_type,
          roles: app.roles,
          vehicle_info: app.vehicle_info,
          entry_time: userAccessLog?.entry_time || null,
          exit_time: userAccessLog?.exit_time || null,
          entryCompleted: hasEntryLog,
        }
      }) || []

    console.log("[v0] Entry data mapped:", entryData.length)

    const constructionPlans = [
      ...new Set(
        applications
          ?.map((app: any) => app.construction_plans?.title)
          .filter((title: string | undefined) => title !== undefined) || [],
      ),
    ].sort()

    console.log("[v0] Construction plans:", constructionPlans.length)

    if (constructionPlanFilter && constructionPlanFilter !== "all") {
      entryData = entryData.filter((entry) => entry.construction_plan_title === constructionPlanFilter)
    }

    entryData.sort((a, b) => {
      const aTime = a.exit_time || a.entry_time
      const bTime = b.exit_time || b.entry_time

      if (aTime && bTime) {
        return new Date(bTime).getTime() - new Date(aTime).getTime()
      }

      if (aTime && !bTime) return -1
      if (!aTime && bTime) return 1

      return a.name.localeCompare(b.name, "ko-KR")
    })

    const getKSTDateString = (dateString: string | null): string => {
      if (!dateString) return ""
      try {
        const date = new Date(dateString)
        return new Intl.DateTimeFormat("ko-KR", {
          timeZone: "Asia/Seoul",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
          .format(date)
          .split(". ")
          .join("-")
          .replace(".", "")
      } catch {
        return ""
      }
    }

    const stats = {
      total: entryData.length,
      entered: entryData.filter((entry) => {
        // Only count as "entered" if they have entry_time from today and no exit_time yet
        if (!entry.entry_time || entry.exit_time) return false
        const entryDate = getKSTDateString(entry.entry_time)
        return entryDate === date
      }).length,
      exited: entryData.filter((entry) => {
        // Only count as "exited" if they have exit_time from today
        if (!entry.exit_time) return false
        const exitDate = getKSTDateString(entry.exit_time)
        return exitDate === date
      }).length,
      not_entered: entryData.filter((entry) => !entry.entry_time).length,
    }

    console.log("[v0] Stats for date", date, ":", stats)

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
    console.error("[v0] Error in entry-status API:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500, headers: noStoreHeaders },
    )
  }
}
