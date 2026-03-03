import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const session = cookieStore.get("wie-admin-session")

    if (session && session.value === "authenticated") {
      return NextResponse.json({ authenticated: true })
    } else {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }
  } catch (error) {
    console.error("WIE Admin auth check error:", error)
    return NextResponse.json({ authenticated: false }, { status: 500 })
  }
}
