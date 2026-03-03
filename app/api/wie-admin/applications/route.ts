import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export const dynamic = "force-dynamic"
export const revalidate = 0

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() {
          return []
        },
        setAll() {},
      },
    })

    console.log("WIE 신청 목록 조회 시작...")

    const { data: applications, error } = await supabase
      .from("users")
      .select(`
        *,
        construction_plans(
          id,
          title,
          company,
          start_date,
          end_date,
          status
        )
      `)
      .not("construction_plan_id", "is", null)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("WIE 신청 조회 오류:", error)
      return NextResponse.json({ error: "신청 목록을 불러올 수 없습니다." }, { status: 500, headers: noStoreHeaders })
    }

    const wieApplications =
      applications
        ?.filter((app) => app.construction_plans?.company === "WIE")
        .map((app) => ({
          ...app,
          construction_plan: app.construction_plans, // Rename to singular
          construction_plans: undefined, // Remove plural field
        })) || []

    console.log(`WIE 신청 ${wieApplications.length}개 조회 완료`)

    return NextResponse.json(wieApplications, { headers: noStoreHeaders })
  } catch (error) {
    console.error("WIE 신청 목록 조회 실패:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500, headers: noStoreHeaders })
  }
}
