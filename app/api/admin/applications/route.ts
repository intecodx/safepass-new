import { type NextRequest, NextResponse } from "next/server"
import { getConstructionPlans, getAccessLogs } from "@/lib/supabase-storage"
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
    const allConstructionPlans = await getConstructionPlans()
    const intecoConstructionPlans = allConstructionPlans.filter((plan) => plan.company !== "WIE")

    // Fetch only needed fields instead of getUsers() which returns select(*)
    const { data: registeredUsers, error: usersError } = await supabase
      .from("users")
      .select(`
        id,
        name,
        phone,
        nationality,
        passport_number,
        birth_date,
        gender,
        status,
        roles,
        vehicle_info,
        construction_plan_id,
        created_at
      `)
      .order("created_at", { ascending: false })

    if (usersError) {
      console.error("사용자 조회 실패:", usersError)
      return NextResponse.json({ error: "신청 목록을 불러올 수 없습니다." }, { status: 500, headers: noStoreHeaders })
    }

    const intecoConstructionPlanIds = new Set(intecoConstructionPlans.map((plan) => plan.id))
    const intecoUsers = (registeredUsers || []).filter(
      (user) => user.construction_plan_id && intecoConstructionPlanIds.has(user.construction_plan_id),
    )

    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get("date") || new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })).toISOString().split("T")[0]
    const accessLogs = await getAccessLogs(dateParam)

    const sortedUsers = intecoUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    if (sortedUsers.length === 0) {
      return NextResponse.json([], { headers: noStoreHeaders })
    }

    const applicationsWithPlans = sortedUsers.map((user) => {
      const constructionPlan = user.construction_plan_id
        ? intecoConstructionPlans.find((plan) => plan.id === user.construction_plan_id)
        : null

      const userAccessLog = accessLogs.find((log) => log.user_id === user.id)
      const hasEntryLog = userAccessLog && userAccessLog.entry_time !== null
      const hasExitLog = userAccessLog && userAccessLog.exit_time !== null

      let entryTime: string | undefined
      let exitTime: string | undefined

      if (hasEntryLog && userAccessLog.entry_time) {
        entryTime = userAccessLog.entry_time
      }
      if (hasExitLog && userAccessLog.exit_time) {
        exitTime = userAccessLog.exit_time
      }

      return {
        id: user.id,
        name: user.name,
        phone: user.phone,
        nationality: user.nationality,
        passport_number: user.passport_number,
        birth_date: user.birth_date,
        gender: user.gender,
        status: user.status,
        construction_plan: constructionPlan
          ? {
              id: constructionPlan.id,
              title: constructionPlan.title,
              company: constructionPlan.company,
              work_company: constructionPlan.work_company,
            }
          : null,
        roles: user.roles,
        vehicle_info: user.vehicle_info,
        created_at: user.created_at,
        work_status: {
          entry_completed: !!hasEntryLog,
          exit_completed: !!hasExitLog,
          today_logs_count: (hasEntryLog ? 1 : 0) + (hasExitLog ? 1 : 0),
          entry_time: entryTime,
          exit_time: exitTime,
        },
      }
    })

    return NextResponse.json(applicationsWithPlans, { headers: noStoreHeaders })
  } catch (error) {
    console.error("신청 목록 조회 실패:", error)
    return NextResponse.json({ error: "신청 목록을 불러올 수 없습니다." }, { status: 500, headers: noStoreHeaders })
  }
}
