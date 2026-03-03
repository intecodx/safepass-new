import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export const dynamic = "force-dynamic"
export const revalidate = 0

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const applicationId = Number.parseInt(params.id)

    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() {
          return []
        },
        setAll() {},
      },
    })

    const { data: application, error: fetchError } = await supabase
      .from("users")
      .select(`
        *,
        construction_plans(company)
      `)
      .eq("id", applicationId)
      .single()

    if (fetchError || !application) {
      return NextResponse.json({ error: "신청을 찾을 수 없습니다." }, { status: 404, headers: noStoreHeaders })
    }

    if (application.construction_plans?.company !== "WIE") {
      return NextResponse.json({ error: "WIE 신청만 처리할 수 있습니다." }, { status: 403, headers: noStoreHeaders })
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({
        status: "rejected",
      })
      .eq("id", applicationId)

    if (updateError) {
      console.error("반려 처리 오류:", updateError)
      return NextResponse.json({ error: "반려 처리 중 오류가 발생했습니다." }, { status: 500, headers: noStoreHeaders })
    }

    return NextResponse.json({ message: "신청이 반려되었습니다." }, { headers: noStoreHeaders })
  } catch (error) {
    console.error("WIE 반려 처리 실패:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500, headers: noStoreHeaders })
  }
}
