import { type NextRequest, NextResponse } from "next/server"
import { addUser, findUserByPhoneAndConstructionPlan } from "@/lib/supabase-storage"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("등록 요청 데이터:", body)

    const {
      name,
      phone,
      email,
      nationality,
      passportNumber,
      birthDate,
      gender,
      bloodType,
      roles,
      vehicleNumber,
      vehicleType,
      constructionPlanId,
    } = body

    // 필수 필드 검증
    if (!name || !phone || !birthDate || !gender) {
      console.log("필수 필드 누락:", { name, phone, birthDate, gender })
      return NextResponse.json({ error: "필수 정보를 모두 입력해주세요." }, { status: 400 })
    }

    const constructionPlanIdNumber = constructionPlanId ? Number.parseInt(constructionPlanId) : null
    const existingUser = await findUserByPhoneAndConstructionPlan(phone, constructionPlanIdNumber)
    if (existingUser) {
      console.log("중복 전화번호와 공사계획:", phone, constructionPlanIdNumber)
      return NextResponse.json(
        {
          error:
            "해당 공사계획에 이미 등록된 전화번호입니다. 다른 공사계획을 선택하시거나 다른 전화번호를 사용해주세요.",
        },
        { status: 400 },
      )
    }

    // 사용자 데이터 생성 (email 필드 제거)
    const userData = {
      name,
      phone,
      nationality: nationality || "KR",
      passport_number: nationality !== "KR" ? passportNumber : null,
      birth_date: birthDate,
      gender,
      blood_type: bloodType,
      construction_plan_id: constructionPlanIdNumber,
      roles: {
        site_manager: roles?.siteManager || false,
        vehicle_owner: roles?.vehicleOwner || false,
      },
      vehicle_info:
        roles?.vehicleOwner && vehicleNumber && vehicleType
          ? {
              number: vehicleNumber,
              type: vehicleType,
            }
          : null,
    }

    console.log("저장할 사용자 데이터:", userData)

    const newUser = await addUser(userData)

    if (!newUser) {
      return NextResponse.json({ error: "사용자 등록 중 오류가 발생했습니다." }, { status: 500 })
    }

    console.log("✅ 사용자 등록 완료!")
    console.log("저장된 사용자 정보:")
    console.log(`- ID: ${newUser.id}`)
    console.log(`- 이름: ${newUser.name}`)
    console.log(`- 전화번호: ${newUser.phone}`)
    console.log(`- construction_plan_id: ${newUser.construction_plan_id}`)
    console.log(`- 상태: ${newUser.status}`)
    console.log("🎯 관리자 신청관리에서 이 사용자를 확인할 수 있습니다!")

    return NextResponse.json({
      success: true,
      id: newUser.id,
      message: "출입 신청이 성공적으로 등록되었습니다.",
    })
  } catch (error) {
    console.error("사용자 등록 실패:", error)
    return NextResponse.json({ error: "등록 중 오류가 발생했습니다." }, { status: 500 })
  }
}
