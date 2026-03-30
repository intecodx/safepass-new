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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const now = new Date()
    const koreaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }))
    const dateParam = searchParams.get("date") || koreaTime.toISOString().split("T")[0]

    const startUTC = new Date(`${dateParam}T00:00:00+09:00`).toISOString()
    const endUTC = new Date(`${dateParam}T23:59:59+09:00`).toISOString()

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

    const { data: accessLogs, error } = await supabase
      .from("access_logs")
      .select(`
        id,
        user_id,
        entry_time,
        exit_time,
        created_at,
        user:users!inner(
          id,
          name,
          phone,
          status,
          construction_plan:construction_plans!inner(id, title, company)
        )
      `)
      .eq("user.construction_plan.company", "WIE")
      .gte("created_at", startUTC)
      .lte("created_at", endUTC)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("WIE 출입 로그 조회 오류:", error)
      return NextResponse.json(
        { error: "출입 로그 조회 중 오류가 발생했습니다." },
        { status: 500, headers: noStoreHeaders },
      )
    }

    return NextResponse.json(accessLogs || [], { headers: noStoreHeaders })
  } catch (error) {
    console.error("WIE 출입 로그 조회 오류:", error)
    return NextResponse.json(
      { error: "출입 로그 조회 중 오류가 발생했습니다." },
      { status: 500, headers: noStoreHeaders },
    )
  }
}
