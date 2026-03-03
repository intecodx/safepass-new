import { type NextRequest, NextResponse } from "next/server"
import { getUserById, getUserLatestAccessLog, addAccessLog, updateAccessLogWithExit } from "@/lib/supabase-storage"

export async function POST(request: NextRequest) {
  try {
    const { qrData, scannedData } = await request.json()

    console.log("[v0] INTECO QR 검증 요청:", { qrData, scannedData })

    const qrCompany = qrData.company
    if (qrCompany === "WIE") {
      return NextResponse.json(
        {
          success: false,
          error: "이 QR코드는 INTECO 경비실에서 사용할 수 없습니다",
        },
        { status: 403 },
      )
    }

    // Extract user ID from QR data
    const userId = qrData.userId || qrData.id
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "QR코드에 사용자 ID가 없습니다",
        },
        { status: 400 },
      )
    }

    // Get user information from database
    const user = await getUserById(userId)
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "등록되지 않은 사용자입니다",
        },
        { status: 404 },
      )
    }

    // Check if user is approved
    if (user.status !== "approved") {
      return NextResponse.json(
        {
          success: false,
          error: `출입이 승인되지 않은 사용자입니다 (현재 상태: ${user.status})`,
        },
        { status: 403 },
      )
    }

    // Verify user information matches QR data
    const qrName = qrData.name
    const qrPhone = qrData.phone

    if (qrName && qrName !== user.name) {
      return NextResponse.json(
        {
          success: false,
          error: "QR코드의 이름 정보가 일치하지 않습니다",
        },
        { status: 403 },
      )
    }

    if (qrPhone && qrPhone !== user.phone) {
      return NextResponse.json(
        {
          success: false,
          error: "QR코드의 연락처 정보가 일치하지 않습니다",
        },
        { status: 403 },
      )
    }

    if (user.construction_plan && user.construction_plan.end_date) {
      const endDate = new Date(user.construction_plan.end_date)
      endDate.setHours(23, 59, 59, 999) // Set to end of day
      const currentTime = Date.now()

      if (currentTime > endDate.getTime()) {
        return NextResponse.json(
          {
            success: false,
            error: "공사계획 기간이 종료되었습니다",
          },
          { status: 403 },
        )
      }

      console.log("[v0] 공사계획 유효성 확인 완료:", {
        constructionPlan: user.construction_plan.title,
        endDate: user.construction_plan.end_date,
        isValid: true,
      })
    } else if (qrData.validUntil) {
      // Fallback to QR validUntil if construction plan not available
      const validUntilTime = new Date(qrData.validUntil).getTime()
      const currentTime = Date.now()

      if (currentTime > validUntilTime) {
        return NextResponse.json(
          {
            success: false,
            error: "QR코드가 만료되었습니다 (공사계획 기간 종료)",
          },
          { status: 403 },
        )
      }
    } else if (qrData.approvedAt) {
      // Fallback to 24 hour check if no construction plan end date
      const approvedTime = new Date(qrData.approvedAt).getTime()
      const currentTime = Date.now()
      const hoursDiff = (currentTime - approvedTime) / (1000 * 60 * 60)

      if (hoursDiff > 24) {
        return NextResponse.json(
          {
            success: false,
            error: "QR코드가 만료되었습니다 (24시간 초과)",
          },
          { status: 403 },
        )
      }
    }

    const latestLog = await getUserLatestAccessLog(userId)
    let message = ""
    let isExit = false

    if (!latestLog) {
      // First time entry
      message = "출입이 승인되었습니다"
      isExit = false
    } else if (latestLog.entry_time && !latestLog.exit_time) {
      // User has entered but not exited - process as exit
      message = "퇴근완료"
      isExit = true
    } else if (latestLog.entry_time && latestLog.exit_time) {
      // User has both entry and exit - process as new entry
      message = "출입이 승인되었습니다"
      isExit = false
    } else {
      // Fallback - process as entry
      message = "출입이 승인되었습니다"
      isExit = false
    }

    // Prepare user info for response
    const userInfo = {
      id: user.id,
      name: user.name,
      phone: user.phone,
      company: qrCompany || user.construction_plan_name || `공사 ${user.construction_plan_id}`,
      birthDate: user.birth_date,
      nationality: user.nationality,
      constructionPlan: user.construction_plan_name || `공사 ${user.construction_plan_id}`,
      approvedAt: qrData.approvedAt || user.updated_at,
      isExit: isExit,
    }

    try {
      if (isExit && latestLog) {
        // Update existing log with exit time
        await updateAccessLogWithExit(latestLog.id)
        console.log("[v0] INTECO 퇴근 처리 완료:", user.name)
      } else {
        const now = new Date()
        console.log("[v0] ===== INTECO 출근 시간 디버그 =====")
        console.log("[v0] 사용자:", user.name)
        console.log("[v0] 현재 UTC 시간:", now.toISOString())
        console.log("[v0] UTC 타임스탬프(ms):", now.getTime())

        // Calculate what Korean time should be
        const kstTime = new Date(now.getTime() + 9 * 60 * 60 * 1000)
        console.log("[v0] 예상 한국 시간:", kstTime.toISOString())
        console.log(
          "[v0] 한국 시간 표시:",
          new Intl.DateTimeFormat("ko-KR", {
            timeZone: "Asia/Seoul",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          }).format(now),
        )
        console.log("[v0] =====================================")

        // Add new entry log
        await addAccessLog({
          user_id: user.id,
          event_type: "check_in",
          timestamp: now.toISOString(),
          qr_data: JSON.stringify(qrData),
        })
        console.log("[v0] INTECO 출입 로그 저장 완료:", user.name)
      }
    } catch (logError) {
      console.error("[v0] INTECO 출입 로그 처리 실패:", logError)
      // Don't fail the entire request if logging fails
    }

    console.log("[v0] INTECO QR 검증 성공:", userInfo)

    return NextResponse.json({
      success: true,
      message: message,
      user: userInfo,
    })
  } catch (error) {
    console.error("[v0] INTECO QR 검증 실패:", error)
    return NextResponse.json(
      {
        success: false,
        error: "QR코드 검증 중 오류가 발생했습니다",
      },
      { status: 500 },
    )
  }
}
