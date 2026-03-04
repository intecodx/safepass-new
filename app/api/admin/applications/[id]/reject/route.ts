import { type NextRequest, NextResponse } from "next/server"
import { updateUserStatus, getUserById } from "@/lib/supabase-storage"
import { sendSMS } from "@/lib/sms-service"
import { deleteVehicle } from "@/lib/amano-api"

export const dynamic = "force-dynamic"
export const revalidate = 0

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { phone, reason } = await request.json()
    const applicationId = Number.parseInt(params.id)

    // 반려 전 아마노 등록 차량이 있으면 삭제
    const existingUser = await getUserById(applicationId)
    if (existingUser) {
      const vehicleInfo = existingUser.vehicle_info as any
      if (vehicleInfo?.amanoPreDiscountId) {
        console.log(`🚗 아마노 방문차량 삭제 시도: preDiscountId=${vehicleInfo.amanoPreDiscountId}`)
        const amanoDeleteResult = await deleteVehicle({ preDiscountId: vehicleInfo.amanoPreDiscountId })
        if (amanoDeleteResult.success) {
          console.log("✅ 아마노 방문차량 삭제 완료")
        } else {
          console.warn(`⚠️ 아마노 방문차량 삭제 실패: ${amanoDeleteResult.error}`)
        }
      }
    }

    // 사용자 상태를 반려로 업데이트
    const updatedUser = await updateUserStatus(applicationId, "rejected")

    if (!updatedUser) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404, headers: noStoreHeaders })
    }

    console.log(`반려 처리 완료: ID ${applicationId}, 전화번호: ${phone}`)

    // 반려 SMS 메시지 템플릿
    const smsMessage = `[인천종합에너지 SafePass]
안녕하세요, ${updatedUser.name}님.

출입신청이 반려되었습니다.

${reason ? `사유: ${reason}` : "자세한 사유는 담당자에게 문의하시기 바랍니다."}

재신청을 원하시면 다시 신청해주세요.

문의: 인천종합에너지 보안팀`

    // 실제 SMS 발송
    const smsResult = await sendSMS({
      to: phone,
      text: smsMessage,
    })

    if (!smsResult.success) {
      console.error("SMS 발송 실패:", smsResult.error)
      return NextResponse.json(
        {
          success: true,
          message: "반려 처리가 완료되었지만 SMS 발송에 실패했습니다.",
          smsError: smsResult.error,
          warning: "SMS 발송 실패",
        },
        { headers: noStoreHeaders },
      )
    }

    console.log("SMS 발송 성공:", smsResult.data)

    return NextResponse.json(
      {
        success: true,
        message: "신청이 반려되었고 알림 문자가 발송되었습니다.",
        smsResult: smsResult.data,
      },
      { headers: noStoreHeaders },
    )
  } catch (error) {
    console.error("반려 처리 실패:", error)
    return NextResponse.json({ error: "반려 처리 중 오류가 발생했습니다." }, { status: 500, headers: noStoreHeaders })
  }
}
