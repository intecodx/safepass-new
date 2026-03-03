import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // WIE 관리자 인증 (ID: 1234, PW: 1234)
    if (username === "1234" && password === "1234") {
      const cookieStore = cookies()

      // 세션 쿠키 설정
      cookieStore.set("wie-admin-session", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24시간
      })

      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "잘못된 아이디 또는 비밀번호입니다." }, { status: 401 })
    }
  } catch (error) {
    console.error("WIE Admin login error:", error)
    return NextResponse.json({ error: "로그인 처리 중 오류가 발생했습니다." }, { status: 500 })
  }
}
