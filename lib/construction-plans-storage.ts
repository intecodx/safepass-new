// 공사계획 전역 데이터 저장소 (실제 환경에서는 데이터베이스 사용)
export interface ConstructionPlan {
  id: number
  title: string
  description: string
  company: string
  start_date: string
  end_date: string
  site_manager: string
  status: string
  created_at: string
}

// 전역 공사계획 저장소
const globalConstructionPlans: ConstructionPlan[] = [
  {
    id: 1,
    title: "A동 전기공사",
    description: "A동 전기설비 교체 및 보수공사\n- 전력 케이블 교체\n- 분전반 설치\n- 조명 시설 개선",
    company: "(주)한국전기공사",
    start_date: "2024-02-01",
    end_date: "2024-03-31",
    site_manager: "김현장",
    status: "ongoing",
    created_at: "2024-01-15T09:00:00Z",
  },
  {
    id: 2,
    title: "B동 배관공사",
    description: "B동 급수배관 교체공사\n- 노후 배관 철거\n- 신규 배관 설치\n- 누수 점검 및 보수",
    company: "(주)대한배관",
    start_date: "2024-02-15",
    end_date: "2024-04-15",
    site_manager: "이현장",
    status: "planned",
    created_at: "2024-01-20T10:30:00Z",
  },
  {
    id: 3,
    title: "C동 도장공사",
    description: "C동 외벽 도장 및 방수공사\n- 기존 도장 제거\n- 방수 처리\n- 외벽 도장 작업",
    company: "(주)미래도장",
    start_date: "2024-03-01",
    end_date: "2024-05-01",
    site_manager: "정현장",
    status: "planned",
    created_at: "2024-01-25T14:15:00Z",
  },
]

let nextPlanId = 4

export const getConstructionPlans = (): ConstructionPlan[] => {
  return [...globalConstructionPlans] // 복사본 반환
}

export const addConstructionPlan = (planData: Omit<ConstructionPlan, "id" | "created_at">): ConstructionPlan => {
  const newPlan: ConstructionPlan = {
    ...planData,
    id: nextPlanId++,
    created_at: new Date().toISOString(),
  }

  globalConstructionPlans.unshift(newPlan) // 최신 항목을 맨 앞에 추가
  console.log("새 공사계획 추가됨:", newPlan)
  console.log("전체 공사계획 목록:", globalConstructionPlans)

  return newPlan
}

export const findConstructionPlanById = (id: number): ConstructionPlan | undefined => {
  return globalConstructionPlans.find((plan) => plan.id === id)
}

export const getActiveConstructionPlans = (): ConstructionPlan[] => {
  const activePlans = globalConstructionPlans.filter((plan) => plan.status === "planned" || plan.status === "ongoing")
  console.log("활성 공사계획 필터링 결과:", activePlans)
  return activePlans
}
