import { NextResponse } from "next/server"
import { getUserStats } from "@/lib/supabase-storage"

export const dynamic = "force-dynamic"
export const revalidate = 0

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

export async function GET() {
  try {
    const stats = await getUserStats()
    console.log("통계 데이터:", stats)
    return NextResponse.json(stats, { headers: noStoreHeaders })
  } catch (error) {
    console.error("통계 조회 실패:", error)
    return NextResponse.json(
      {
        pending: 0,
        approved: 0,
        completed: 0,
        rejected: 0,
      },
      { headers: noStoreHeaders },
    )
  }
}
