import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()

    // 세션 쿠키 삭제
    cookieStore.delete("wie-admin-session")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("WIE Admin logout error:", error)
    return NextResponse.json({ error: "로그아웃 처리 중 오류가 발생했습니다." }, { status: 500 })
  }
}
