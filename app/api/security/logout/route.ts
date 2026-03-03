import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"
export const revalidate = 0

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

export async function POST() {
  try {
    const cookieStore = await cookies()
    cookieStore.set("security-session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
    })

    return NextResponse.json({ success: true }, { headers: noStoreHeaders })
  } catch (error) {
    console.error("로그아웃 실패:", error)
    return NextResponse.json({ error: "로그아웃 중 오류가 발생했습니다." }, { status: 500, headers: noStoreHeaders })
  }
}
