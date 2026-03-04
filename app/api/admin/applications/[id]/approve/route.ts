import { type NextRequest, NextResponse } from "next/server"
import { updateUserStatus, updateUser, getUserById, getConstructionPlanById } from "@/lib/supabase-storage"
import { sendSMS } from "@/lib/sms-service"
import { registerVehicle } from "@/lib/amano-api"

export const dynamic = "force-dynamic"
export const revalidate = 0

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const applicationId = Number.parseInt(params.id)
    console.log(`승인 처리 시작: ID ${applicationId}`)

    const user = await getUserById(applicationId)
    if (!user) {
      console.error(`사용자를 찾을 수 없음: ID ${applicationId}`)
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404, headers: noStoreHeaders })
    }

    let company = "미지정"
    let constructionEndDate = null
    if (user.construction_plan_id) {
      const constructionPlan = await getConstructionPlanById(user.construction_plan_id)
      if (constructionPlan) {
        company = constructionPlan.company
        if (constructionPlan.end_date) {
          const endDate = new Date(constructionPlan.end_date)
          endDate.setDate(endDate.getDate() + 1)
          constructionEndDate = endDate.toISOString().split("T")[0]
        }
      }
    }

    console.log(`사용자 정보 확인:`, {
      id: user.id,
      name: user.name,
      phone: user.phone,
      company: company,
      status: user.status,
    })

    const phoneNumber = user.phone || user.phoneNumber || user.mobile
    if (!phoneNumber) {
      console.error(`전화번호가 없음: 사용자 ID ${applicationId}`)
      return NextResponse.json(
        {
          error: "사용자의 전화번호 정보가 없습니다.",
          userInfo: { id: user.id, name: user.name },
        },
        { status: 400, headers: noStoreHeaders },
      )
    }

    console.log(`전화번호 확인: ${phoneNumber}`)

    // 사용자 상태를 승인으로 업데이트
    const updatedUser = await updateUserStatus(applicationId, "approved")
    if (!updatedUser) {
      return NextResponse.json({ error: "상태 업데이트에 실패했습니다." }, { status: 500, headers: noStoreHeaders })
    }

    // 아마노 주차관제 시스템 연동 (차량소유자인 경우에만)
    let amanoResult = null
    const vehicleInfo = updatedUser.vehicle_info as any
    if (vehicleInfo?.number) {
      console.log(`🚗 아마노 방문차량 등록 시작: ${vehicleInfo.number}`)

      let constructionPlan = null
      if (updatedUser.construction_plan_id) {
        constructionPlan = await getConstructionPlanById(updatedUser.construction_plan_id)
      }

      const startDate = constructionPlan?.start_date || new Date().toISOString().split("T")[0]
      const endDate = constructionPlan?.end_date || new Date().toISOString().split("T")[0]

      amanoResult = await registerVehicle({
        carNo: vehicleInfo.number,
        startDate,
        endDate,
        userName: updatedUser.name,
        mobile: phoneNumber,
        memo: `SafePass 출입승인 - ${constructionPlan?.title || "미지정"}`,
      })

      if (amanoResult.success && amanoResult.preDiscountId) {
        // 아마노 등록 ID를 vehicle_info에 저장 (나중에 삭제 시 사용)
        await updateUser(applicationId, {
          vehicle_info: {
            ...vehicleInfo,
            amanoPreDiscountId: amanoResult.preDiscountId,
          },
        } as any)
        console.log(`✅ 아마노 등록 완료: preDiscountId=${amanoResult.preDiscountId}`)
      } else if (!amanoResult.success) {
        console.warn(`⚠️ 아마노 등록 실패 (승인은 계속 진행): ${amanoResult.error}`)
      }
    }

    const userInfo = {
      id: applicationId,
      name: updatedUser.name,
      phone: phoneNumber,
      birthDate: updatedUser.birth_date,
      nationality: updatedUser.nationality,
      constructionPlan: updatedUser.construction_plan_id,
      approvedAt: new Date().toISOString(),
      timestamp: Date.now(),
    }

    const securityToken = Buffer.from(JSON.stringify(userInfo)).toString("base64")

    let baseUrl = "https://safe-pass-inteco.vercel.app"

    // 환경변수가 설정된 경우 우선 사용
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      baseUrl = process.env.NEXT_PUBLIC_SITE_URL
    }

    const qrCodeData = JSON.stringify({
      type: "entry_pass",
      userId: applicationId,
      name: updatedUser.name,
      company: company,
      phone: phoneNumber,
      approvedAt: new Date().toISOString(),
      validUntil: constructionEndDate,
      token: securityToken,
    })

    console.log(`QR코드 데이터 생성: ${qrCodeData}`)

    const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCodeData)}`

    const smsMessage = `[SafePass]
안녕하세요, ${updatedUser.name}님!
출입신청이 승인되었습니다. 아래 QR코드로 출입해주세요.

${qrCodeImageUrl}`

    console.log(`SMS 발송 준비: ${phoneNumber}번으로 전송`)
    console.log(`SMS 내용 길이: ${smsMessage.length}자`)

    const smsResult = await sendSMS({
      to: phoneNumber,
      text: smsMessage,
    })

    console.log("SMS 발송 결과:", smsResult)

    if (!smsResult.success) {
      console.error("SMS 발송 실패:", smsResult.error)
      // SMS 발송 실패해도 승인은 완료되었으므로 경고 메시지와 함께 성공 처리
      return NextResponse.json(
        {
          success: true,
          message: "승인이 완료되었지만 SMS 발송에 실패했습니다. QR코드 URL을 수동으로 전달해주세요.",
          qrCodeData,
          qrCodeImageUrl,
          smsMessage,
          smsError: smsResult.error,
          warning: "SMS 발송 실패",
          amanoResult: amanoResult ? { success: amanoResult.success, error: amanoResult.error } : null,
        },
        { headers: noStoreHeaders },
      )
    }

    console.log("SMS 발송 성공:", smsResult.data)

    return NextResponse.json(
      {
        success: true,
        message: "승인이 완료되고 출입용 QR코드가 문자로 발송되었습니다.",
        qrCodeData,
        qrCodeImageUrl,
        smsMessage,
        smsResult: smsResult.data,
        amanoResult: amanoResult ? { success: amanoResult.success, error: amanoResult.error } : null,
      },
      { headers: noStoreHeaders },
    )
  } catch (error) {
    console.error("승인 처리 실패:", error)
    return NextResponse.json({ error: "승인 처리 중 오류가 발생했습니다." }, { status: 500, headers: noStoreHeaders })
  }
}
