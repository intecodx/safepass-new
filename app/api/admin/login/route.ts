import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (username === "safe2025" && password === "safe2025") {
      const cookieStore = await cookies()
      cookieStore.set("security-session", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24시간
      })

      return NextResponse.json({ success: true, userType: "security" })
    } else if (username === "gon2025" && password === "gon2025") {
      const cookieStore = await cookies()
      cookieStore.set("admin-session", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24시간
      })

      return NextResponse.json({ success: true, userType: "admin" })
    } else if (username === "gon0412" && password === "gon0412") {
      const cookieStore = await cookies()
      cookieStore.set("wie-admin-session", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24시간
      })

      return NextResponse.json({ success: true, userType: "wie-admin" })
    } else if (username === "pass2025" && password === "pass2025") {
      const cookieStore = await cookies()
      cookieStore.set("wie-security-session", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24시간
      })

      return NextResponse.json({ success: true, userType: "wie-security" })
    } else {
      return NextResponse.json({ error: "로그인 정보가 올바르지 않습니다." }, { status: 401 })
    }
  } catch (error) {
    console.error("로그인 실패:", error)
    return NextResponse.json({ error: "로그인 중 오류가 발생했습니다." }, { status: 500 })
  }
}
