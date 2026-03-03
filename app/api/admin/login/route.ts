import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

// 관리자 계정 (환경변수에서 로드, 기본값은 개발용)
const ADMIN_ACCOUNTS = [
  {
    username: process.env.ADMIN_SECURITY_ID || "safe2025",
    password: process.env.ADMIN_SECURITY_PW || "safe2025",
    sessionName: "security-session",
    userType: "security",
  },
  {
    username: process.env.ADMIN_INTECO_ID || "gon2025",
    password: process.env.ADMIN_INTECO_PW || "gon2025",
    sessionName: "admin-session",
    userType: "admin",
  },
  {
    username: process.env.ADMIN_WIE_ID || "gon0412",
    password: process.env.ADMIN_WIE_PW || "gon0412",
    sessionName: "wie-admin-session",
    userType: "wie-admin",
  },
  {
    username: process.env.ADMIN_WIE_SECURITY_ID || "pass2025",
    password: process.env.ADMIN_WIE_SECURITY_PW || "pass2025",
    sessionName: "wie-security-session",
    userType: "wie-security",
  },
]

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    const account = ADMIN_ACCOUNTS.find(
      (acc) => acc.username === username && acc.password === password
    )

    if (account) {
      const cookieStore = await cookies()
      cookieStore.set(account.sessionName, "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24시간
      })

      return NextResponse.json({ success: true, userType: account.userType })
    } else {
      return NextResponse.json({ error: "로그인 정보가 올바르지 않습니다." }, { status: 401 })
    }
  } catch (error) {
    console.error("로그인 실패:", error)
    return NextResponse.json({ error: "로그인 중 오류가 발생했습니다." }, { status: 500 })
  }
}
