import { type NextRequest, NextResponse } from "next/server"
import { getUserById } from "@/lib/supabase-storage"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const applicationId = Number.parseInt(params.id)
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    console.log("[v0] QR 검증 API 호출 - ID:", applicationId, "Token:", token ? "있음" : "없음")

    if (!token) {
      return NextResponse.json({ error: "유효하지 않은 QR코드입니다." }, { status: 400 })
    }

    // 사용자 정보 조회
    console.log("[v0] 사용자 정보 조회 시작 - ID:", applicationId)
    const user = await getUserById(applicationId)
    console.log("[v0] 사용자 조회 결과:", user ? `찾음 (${user.name})` : "없음")

    if (!user) {
      console.log("[v0] 사용자를 찾을 수 없음 - ID:", applicationId)
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 })
    }

    console.log("[v0] 사용자 상태:", user.status)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        birth_date: user.birth_date,
        nationality: user.nationality,
        status: user.status,
        construction_plan: user.construction_plan,
        created_at: user.created_at,
      },
      message: "유효한 QR코드입니다.",
    })
  } catch (error) {
    console.error("[v0] QR코드 검증 실패:", error)
    return NextResponse.json({ error: "QR코드 검증 중 오류가 발생했습니다." }, { status: 500 })
  }
}
