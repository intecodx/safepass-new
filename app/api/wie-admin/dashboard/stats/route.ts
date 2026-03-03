import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"
export const revalidate = 0

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    })

    const { data: users } = await supabase
      .from("users")
      .select("status, created_at, construction_plan_id, construction_plans!inner(company)")
      .eq("construction_plans.company", "WIE")

    const totalApplications = users?.length || 0
    const pendingApplications = users?.filter((user) => user.status === "pending").length || 0
    const approvedApplications = users?.filter((user) => user.status === "approved").length || 0
    const rejectedApplications = users?.filter((user) => user.status === "rejected").length || 0

    // Get today's applications
    const today = new Date().toISOString().split("T")[0]
    const todayApplications = users?.filter((user) => user.created_at?.startsWith(today)).length || 0

    const { data: constructionPlans } = await supabase.from("construction_plans").select("status").eq("company", "WIE")

    const totalConstructionPlans = constructionPlans?.length || 0
    const activeConstructionPlans =
      constructionPlans?.filter((plan) => plan.status === "진행중" || plan.status === "계획").length || 0
    const completedConstructionPlans = constructionPlans?.filter((plan) => plan.status === "완료").length || 0

    return NextResponse.json(
      {
        totalApplications,
        pendingApplications,
        approvedApplications,
        rejectedApplications,
        totalConstructionPlans,
        activeConstructionPlans,
        completedConstructionPlans,
        todayApplications,
      },
      { headers: noStoreHeaders },
    )
  } catch (error) {
    console.error("통계 데이터 조회 실패:", error)
    return NextResponse.json(
      { error: "통계 데이터를 불러오는데 실패했습니다." },
      { status: 500, headers: noStoreHeaders },
    )
  }
}
