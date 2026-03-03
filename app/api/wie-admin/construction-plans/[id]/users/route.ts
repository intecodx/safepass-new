import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export const dynamic = "force-dynamic"
export const revalidate = 0

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get: () => "",
        set: () => {},
        remove: () => {},
      },
    })

    const { count, error } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("construction_plan_id", params.id)

    if (error) {
      console.error("WIE 공사계획 사용자 수 조회 실패:", error)
      return NextResponse.json({ success: false, count: 0 }, { status: 500, headers: noStoreHeaders })
    }

    return NextResponse.json({ success: true, count: count || 0 }, { headers: noStoreHeaders })
  } catch (error) {
    console.error("WIE 공사계획 사용자 수 조회 중 오류:", error)
    return NextResponse.json({ success: false, count: 0 }, { status: 500, headers: noStoreHeaders })
  }
}
