import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export const dynamic = "force-dynamic"
export const revalidate = 0

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

export async function GET() {
  try {
    // WIE 발주처의 공사계획에 연결된 사용자들만 조회
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select(`
        *,
        construction_plans!inner(
          id,
          title,
          company
        )
      `)
      .eq("construction_plans.company", "WIE")

    if (usersError) {
      console.error("사용자 조회 오류:", usersError)
      return NextResponse.json({ error: "사용자 조회 실패" }, { status: 500, headers: noStoreHeaders })
    }

    // WIE 공사계획만 조회
    const { data: constructionPlans, error: plansError } = await supabase
      .from("construction_plans")
      .select("*")
      .eq("company", "WIE")

    if (plansError) {
      console.error("공사계획 조회 오류:", plansError)
      return NextResponse.json({ error: "공사계획 조회 실패" }, { status: 500, headers: noStoreHeaders })
    }

    // 통계 계산
    const totalUsers = users.length
    const totalCompanies = new Set(users.map((user) => user.construction_plans?.company).filter(Boolean)).size
    const totalProjects = constructionPlans.length

    // 상태별 분류
    const statusBreakdown = {
      pending: users.filter((u) => u.status === "pending").length,
      approved: users.filter((u) => u.status === "approved").length,
      completed: users.filter((u) => u.status === "completed").length,
      rejected: users.filter((u) => u.status === "rejected").length,
    }

    // 업체별 분류
    const companyMap = new Map()
    users.forEach((user) => {
      const company = user.construction_plans?.company
      if (company) {
        companyMap.set(company, (companyMap.get(company) || 0) + 1)
      }
    })

    const companyBreakdown = Array.from(companyMap.entries())
      .map(([company, count]) => ({
        company,
        count,
        percentage: totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)

    // 프로젝트별 분류
    const projectMap = new Map()
    users.forEach((user) => {
      const project = user.construction_plans?.title
      const company = user.construction_plans?.company
      if (project) {
        const key = `${project}|${company}`
        projectMap.set(key, (projectMap.get(key) || 0) + 1)
      }
    })

    const projectBreakdown = Array.from(projectMap.entries())
      .map(([key, count]) => {
        const [project, company] = key.split("|")
        return {
          project,
          company,
          count,
          percentage: totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0,
        }
      })
      .sort((a, b) => b.count - a.count)

    // 역할별 분류
    const roleBreakdown = {
      siteManagers: users.filter((u) => u.roles?.site_manager).length,
      vehicleOwners: users.filter((u) => u.roles?.vehicle_owner).length,
      generalWorkers: users.filter((u) => !u.roles?.site_manager && !u.roles?.vehicle_owner).length,
    }

    // 국적별 분류
    const nationalityBreakdown = {
      domestic: users.filter((u) => u.nationality === "KR").length,
      foreign: users.filter((u) => u.nationality !== "KR").length,
    }

    // 최근 7일 통계
    const dailyStats = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]

      const dayUsers = users.filter((user) => {
        const userDate = new Date(user.created_at).toISOString().split("T")[0]
        return userDate === dateStr
      })

      dailyStats.push({
        date: dateStr,
        registrations: dayUsers.length,
        approvals: dayUsers.filter((u) => u.status === "approved").length,
      })
    }

    const statistics = {
      totalUsers,
      totalCompanies,
      totalProjects,
      statusBreakdown,
      companyBreakdown,
      projectBreakdown,
      roleBreakdown,
      nationalityBreakdown,
      dailyStats,
    }

    return NextResponse.json(statistics, { headers: noStoreHeaders })
  } catch (error) {
    console.error("WIE 통계 조회 오류:", error)
    return NextResponse.json({ error: "통계 조회 실패" }, { status: 500, headers: noStoreHeaders })
  }
}
