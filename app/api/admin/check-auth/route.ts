import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"
export const revalidate = 0

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const session = cookieStore.get("admin-session")

    if (session?.value === "authenticated") {
      return NextResponse.json({ authenticated: true }, { headers: noStoreHeaders })
    } else {
      return NextResponse.json({ authenticated: false }, { status: 401, headers: noStoreHeaders })
    }
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({ authenticated: false }, { status: 500, headers: noStoreHeaders })
  }
}
