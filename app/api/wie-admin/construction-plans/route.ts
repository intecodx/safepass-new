import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export const dynamic = "force-dynamic"
export const revalidate = 0

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

export async function GET() {
  try {
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get: () => "",
        set: () => {},
        remove: () => {},
      },
    })

    const { data, error } = await supabase
      .from("construction_plans")
      .select("*")
      .eq("company", "WIE")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("WIE 공사계획 조회 실패:", error)
      return NextResponse.json({ error: "공사계획 조회 실패" }, { status: 500, headers: noStoreHeaders })
    }

    return NextResponse.json(data, { headers: noStoreHeaders })
  } catch (error) {
    console.error("WIE 공사계획 조회 중 오류:", error)
    return NextResponse.json({ error: "서버 오류" }, { status: 500, headers: noStoreHeaders })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, company, work_company, start_date, end_date, site_manager, supervisor, status } = body

    if (company !== "WIE") {
      return NextResponse.json(
        { error: "WIE 관리자는 WIE 공사계획만 등록할 수 있습니다." },
        { status: 400, headers: noStoreHeaders },
      )
    }

    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get: () => "",
        set: () => {},
        remove: () => {},
      },
    })

    const { data, error } = await supabase
      .from("construction_plans")
      .insert([
        {
          title,
          description,
          company,
          work_company,
          start_date,
          end_date,
          site_manager,
          supervisor,
          status,
        },
      ])
      .select()

    if (error) {
      console.error("WIE 공사계획 등록 실패:", error)
      return NextResponse.json({ error: "공사계획 등록 실패" }, { status: 500, headers: noStoreHeaders })
    }

    return NextResponse.json({ success: true, id: data[0].id }, { headers: noStoreHeaders })
  } catch (error) {
    console.error("WIE 공사계획 등록 중 오류:", error)
    return NextResponse.json({ error: "서버 오류" }, { status: 500, headers: noStoreHeaders })
  }
}
