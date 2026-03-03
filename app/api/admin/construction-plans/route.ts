import { NextResponse, type NextRequest } from "next/server"
import { getConstructionPlans, addConstructionPlan } from "@/lib/supabase-storage"
import {
  getConstructionPlans as getConstructionPlansMemory,
  addConstructionPlan as addConstructionPlanMemory,
} from "@/lib/construction-plans-storage"

export async function GET() {
  try {
    const plansFromSupabase = await getConstructionPlans()
    // Supabase가 비어있거나 실패로 빈 배열을 반환하는 경우, 메모리 저장소 폴백
    if (Array.isArray(plansFromSupabase) && plansFromSupabase.length > 0) {
      const intecoPlans = plansFromSupabase.filter((plan) => plan.company !== "WIE")
      return NextResponse.json(intecoPlans)
    }

    const plansFromMemory = getConstructionPlansMemory()
    const intecoPlansFromMemory = plansFromMemory.filter((plan) => plan.company !== "WIE")
    return NextResponse.json(intecoPlansFromMemory)
  } catch (error) {
    console.error("공사계획 조회 실패:", error)
    // 최후 폴백: 메모리 저장소라도 시도
    try {
      const plansFromMemory = getConstructionPlansMemory()
      const intecoPlansFromMemory = plansFromMemory.filter((plan) => plan.company !== "WIE")
      return NextResponse.json(intecoPlansFromMemory)
    } catch (_) {
      return NextResponse.json({ error: "공사계획을 불러올 수 없습니다." }, { status: 500 })
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      company,
      work_company,
      start_date,
      end_date,
      site_manager,
      site_manager_phone,
      supervisor,
      status,
    } = body

    // 입력 검증
    if (!title || !description || !company || !start_date || !end_date || !site_manager) {
      return NextResponse.json({ error: "필수 항목을 모두 입력해주세요." }, { status: 400 })
    }

    // 날짜 검증 - 당일 공사를 허용하도록 수정
    if (new Date(start_date) > new Date(end_date)) {
      return NextResponse.json({ error: "종료일은 시작일보다 이전일 수 없습니다." }, { status: 400 })
    }

    const planPayload = {
      title,
      description,
      company,
      work_company: work_company || null,
      start_date,
      end_date,
      site_manager,
      site_manager_phone: site_manager_phone || null,
      supervisor: supervisor || null,
      status: status || "planned",
    }

    // 1) Supabase에 저장 시도 (성공/실패와 무관하게 ID를 응답하기 위해 결과를 받음)
    const newPlan = await addConstructionPlan(planPayload)

    // 2) 서버 메모리 저장소에도 같이 적재하여, Supabase 실패 시에도 목록에 보이도록 폴백 데이터 유지
    //    (중복 방지를 위해 별도 병합은 하지 않음. GET에서 Supabase가 비어있을 때만 메모리를 사용)
    try {
      addConstructionPlanMemory(planPayload as any)
    } catch (e) {
      console.warn("메모리 저장 폴백 실패(무시 가능):", e)
    }

    if (!newPlan) {
      return NextResponse.json({ error: "공사계획 등록 중 오류가 발생했습니다." }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: newPlan.id })
  } catch (error) {
    // 상세한 오류 로깅 추가
    console.error("공사계획 등록 실패:", error)
    const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류"
    return NextResponse.json({ error: `공사계획 등록 중 오류가 발생했습니다: ${errorMessage}` }, { status: 500 })
  }
}
