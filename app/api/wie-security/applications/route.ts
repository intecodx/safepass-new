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
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    })

    const { data: applications, error } = await supabase
      .from("users")
      .select(`
        id,
        name,
        phone,
        nationality,
        birth_date,
        gender,
        status,
        roles,
        vehicle_info,
        created_at,
        construction_plan:construction_plans(id, title, company, end_date)
      `)
      .eq("construction_plans.company", "WIE")
      .eq("status", "approved")

    if (error) {
      console.error("WIE 신청 조회 오류:", error)
      return NextResponse.json({ error: "신청 조회 중 오류가 발생했습니다." }, { status: 500, headers: noStoreHeaders })
    }

    return NextResponse.json(applications || [], { headers: noStoreHeaders })
  } catch (error) {
    console.error("WIE 신청 조회 오류:", error)
    return NextResponse.json({ error: "신청 조회 중 오류가 발생했습니다." }, { status: 500, headers: noStoreHeaders })
  }
}
