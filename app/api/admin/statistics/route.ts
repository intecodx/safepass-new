import { NextResponse } from "next/server"
import { getAccessStatistics } from "@/lib/supabase-storage"

export const dynamic = "force-dynamic"
export const revalidate = 0

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

export async function GET() {
  try {
    console.log("출입 통계 API 호출...")
    const statistics = await getAccessStatistics()
    console.log("출입 통계 조회 완료")
    return NextResponse.json(statistics, { headers: noStoreHeaders })
  } catch (error) {
    console.error("출입 통계 조회 실패:", error)
    return NextResponse.json({ error: "통계를 불러올 수 없습니다." }, { status: 500, headers: noStoreHeaders })
  }
}
