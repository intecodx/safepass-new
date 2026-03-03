import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { sendSMS } from "@/lib/sms-service"

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
    console.log(`[v0] WIE 승인 처리 시작: ID ${applicationId}`)

    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() {
          return []
        },
        setAll() {},
      },
    })

    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select(
        `
        *,
        construction_plans(id, title, company, work_company, end_date)
      `,
      )
      .eq("id", applicationId)
      .single()

    if (fetchError || !user) {
      console.error(`[v0] 사용자를 찾을 수 없음: ID ${applicationId}`, fetchError)
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404, headers: noStoreHeaders })
    }

    if (user.construction_plans?.company !== "WIE") {
      return NextResponse.json({ error: "WIE 신청만 처리할 수 있습니다." }, { status: 403, headers: noStoreHeaders })
    }

    console.log(`[v0] 사용자 정보:`, {
      id: user.id,
      name: user.name,
      phone: user.phone,
      blood_type: user.blood_type,
      work_company: user.construction_plans?.work_company,
      company: user.construction_plans?.company,
    })

    const phoneNumber = user.phone
    if (!phoneNumber) {
      console.error(`[v0] 전화번호가 없음: 사용자 ID ${applicationId}`)
      return NextResponse.json(
        { error: "사용자의 전화번호 정보가 없습니다." },
        { status: 400, headers: noStoreHeaders },
      )
    }

    let qrValidUntil = null
    if (user.construction_plans?.end_date) {
      const endDate = new Date(user.construction_plans.end_date)
      endDate.setDate(endDate.getDate() + 1)
      qrValidUntil = endDate.toISOString().split("T")[0]
    }

    const { error: updateError } = await supabase.from("users").update({ status: "approved" }).eq("id", applicationId)

    if (updateError) {
      console.error("[v0] 승인 처리 오류:", updateError)
      return NextResponse.json({ error: "승인 처리 중 오류가 발생했습니다." }, { status: 500, headers: noStoreHeaders })
    }

    const userInfo = {
      id: applicationId,
      name: user.name,
      phone: phoneNumber,
      birthDate: user.birth_date,
      nationality: user.nationality,
      constructionPlan: user.construction_plan_id,
      approvedAt: new Date().toISOString(),
      timestamp: Date.now(),
    }

    const securityToken = Buffer.from(JSON.stringify(userInfo)).toString("base64")

    const qrCodeData = JSON.stringify({
      type: "entry_pass",
      userId: applicationId,
      name: user.name,
      company: "WIE",
      phone: phoneNumber,
      approvedAt: new Date().toISOString(),
      validUntil: qrValidUntil,
      token: securityToken,
    })

    console.log(`[v0] QR코드 데이터 생성 완료`)

    const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCodeData)}`

    const smsMessage = `[SafePass]
안녕하세요, ${user.name}님!
출입신청이 승인되었습니다. 아래 QR코드로 출입해주세요.

${qrCodeImageUrl}`

    console.log(`[v0] SMS 발송 준비: ${phoneNumber}`)

    const smsResult = await sendSMS({
      to: phoneNumber,
      text: smsMessage,
    })

    console.log("[v0] SMS 발송 결과:", smsResult)

    if (!smsResult.success) {
      console.error("[v0] SMS 발송 실패:", smsResult.error)
      return NextResponse.json(
        {
          success: true,
          message: "승인이 완료되었지만 SMS 발송에 실패했습니다.",
          qrCodeData,
          qrCodeImageUrl,
          smsMessage,
          smsError: smsResult.error,
          warning: "SMS 발송 실패",
        },
        { headers: noStoreHeaders },
      )
    }

    console.log("[v0] SMS 발송 성공")

    return NextResponse.json(
      {
        success: true,
        message: "승인이 완료되고 출입용 QR코드가 문자로 발송되었습니다.",
        qrCodeData,
        qrCodeImageUrl,
        smsMessage,
        smsResult: smsResult.data,
      },
      { headers: noStoreHeaders },
    )
  } catch (error) {
    console.error("[v0] WIE 승인 처리 실패:", error)
    return NextResponse.json({ error: "승인 처리 중 오류가 발생했습니다." }, { status: 500, headers: noStoreHeaders })
  }
}
