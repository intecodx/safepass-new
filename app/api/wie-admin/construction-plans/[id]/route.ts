import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export const dynamic = "force-dynamic"
export const revalidate = 0

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { title, description, company, work_company, start_date, end_date, site_manager, supervisor, status } = body

    if (company !== "WIE") {
      return NextResponse.json(
        { error: "WIE 관리자는 WIE 공사계획만 수정할 수 있습니다." },
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
      .update({
        title,
        description,
        company,
        work_company,
        start_date,
        end_date,
        site_manager,
        supervisor,
        status,
      })
      .eq("id", params.id)
      .eq("company", "WIE") // Additional security check
      .select()

    if (error) {
      console.error("WIE 공사계획 수정 실패:", error)
      return NextResponse.json({ error: "공사계획 수정 실패" }, { status: 500, headers: noStoreHeaders })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "해당 공사계획을 찾을 수 없습니다." }, { status: 404, headers: noStoreHeaders })
    }

    return NextResponse.json({ success: true }, { headers: noStoreHeaders })
  } catch (error) {
    console.error("WIE 공사계획 수정 중 오류:", error)
    return NextResponse.json({ error: "서버 오류" }, { status: 500, headers: noStoreHeaders })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get: () => "",
        set: () => {},
        remove: () => {},
      },
    })

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id")
      .eq("construction_plan_id", params.id)

    if (usersError) {
      console.error("사용자 확인 실패:", usersError)
      return NextResponse.json({ error: "사용자 확인 실패" }, { status: 500, headers: noStoreHeaders })
    }

    if (users && users.length > 0) {
      return NextResponse.json(
        { error: "연결된 사용자가 있어 삭제할 수 없습니다." },
        { status: 400, headers: noStoreHeaders },
      )
    }

    const { error } = await supabase.from("construction_plans").delete().eq("id", params.id).eq("company", "WIE") // Additional security check

    if (error) {
      console.error("WIE 공사계획 삭제 실패:", error)
      return NextResponse.json({ error: "공사계획 삭제 실패" }, { status: 500, headers: noStoreHeaders })
    }

    return NextResponse.json({ success: true }, { headers: noStoreHeaders })
  } catch (error) {
    console.error("WIE 공사계획 삭제 중 오류:", error)
    return NextResponse.json({ error: "서버 오류" }, { status: 500, headers: noStoreHeaders })
  }
}
