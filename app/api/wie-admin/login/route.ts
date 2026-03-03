import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

// WIE 관리자 계정 (환경변수에서 로드, 기본값은 개발용)
const WIE_ADMIN_ID = process.env.WIE_ADMIN_LOGIN_ID || "1234"
const WIE_ADMIN_PW = process.env.WIE_ADMIN_LOGIN_PW || "1234"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (username === WIE_ADMIN_ID && password === WIE_ADMIN_PW) {
      const cookieStore = cookies()

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
