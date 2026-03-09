import { supabase } from "./supabase"

export { supabase }

// 사용자 인터페이스
export interface User {
  id: number
  name: string
  phone: string
  email?: string
  nationality: string
  passport_number: string | null
  birth_date: string
  gender: string
  construction_plan_id: number | null
  roles: {
    site_manager: boolean
    vehicle_owner: boolean
  }
  vehicle_info: {
    number: string
    type: string
  } | null
  status: string
  qr_code_url: string | null
  created_at: string
}

// 공사계획 인터페이스
export interface ConstructionPlan {
  id: number
  title: string
  description: string
  company: string
  work_company?: string // Added work_company field
  start_date: string
  end_date: string
  site_manager: string
  supervisor?: string // Made supervisor optional
  status: string
  created_at: string
}

// 관리자 인터페이스
export interface Admin {
  id: number
  username: string
  password: string
  created_at: string
}

// 출입 기록 인터페이스
export interface AccessLog {
  id: number
  user_id: number
  entry_time: string | null
  exit_time: string | null
  created_at: string
}

// 통계 인터페이스
export interface AccessStatistics {
  totalUsers: number
  totalCompanies: number
  totalProjects: number
  statusBreakdown: {
    pending: number
    approved: number
    completed: number
    rejected: number
  }
  companyBreakdown: Array<{
    company: string
    count: number
    percentage: number
  }>
  projectBreakdown: Array<{
    project: string
    company: string
    count: number
    percentage: number
  }>
  roleBreakdown: {
    siteManagers: number
    vehicleOwners: number
    generalWorkers: number
  }
  nationalityBreakdown: {
    domestic: number
    foreign: number
  }
  dailyStats: Array<{
    date: string
    registrations: number
    approvals: number
  }>
}

// ========================================
// 사용자 관련 함수들
// ========================================

export const getUsers = async (): Promise<User[]> => {
  console.log("🔄 Supabase에서 사용자 목록 조회 시작...")

  try {
    const { data, error } = await supabase
      .from("users")
      .select(`
        *,
        construction_plan:construction_plans(
          id,
          title,
          company,
          site_manager,
          start_date,
          end_date,
          status
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ 사용자 조회 실패:", error)
      return []
    }

    console.log(`✅ 조회된 사용자 수: ${data?.length || 0}명 (공사계획 정보 포함)`)
    return data || []
  } catch (error) {
    console.error("❌ 사용자 조회 중 예외 발생:", error)
    return []
  }
}

export const findUserById = async (id: number): Promise<User | null> => {
  console.log(`🔄 사용자 ID ${id} 검색`)

  try {
    const { data, error } = await supabase
      .from("users")
      .select(`
        *,
        construction_plan:construction_plans(
          id,
          title,
          company,
          site_manager,
          start_date,
          end_date,
          status
        )
      `)
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        console.log("ℹ️ 해당 ID의 사용자 없음")
        return null
      }

      console.error("❌ 사용자 검색 실패:", error)
      return null
    }

    console.log("✅ 사용자 검색 성공:", data.name, "(공사계획 정보 포함)")
    return data
  } catch (error) {
    console.error("❌ 사용자 검색 중 예외 발생:", error)
    return null
  }
}

export const getUserById = findUserById

// 공사계획별 사용자 조회
export const getUsersByConstructionPlan = async (constructionPlanId: number): Promise<User[]> => {
  console.log(`🔄 공사계획 ID ${constructionPlanId}에 속한 사용자 조회`)

  try {
    const { data, error } = await supabase
      .from("users")
      .select(`
        *,
        construction_plan:construction_plans(
          id,
          title,
          company,
          site_manager,
          start_date,
          end_date,
          status
        )
      `)
      .eq("construction_plan_id", constructionPlanId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ 공사계획별 사용자 조회 실패:", error)
      return []
    }

    console.log(`✅ 공사계획 ID ${constructionPlanId}에 속한 사용자 ${data?.length || 0}명 조회 완료`)
    return data || []
  } catch (error) {
    console.error("❌ 공사계획별 사용자 조회 중 예외 발생:", error)
    return []
  }
}

export const addUser = async (
  userData: Omit<User, "id" | "created_at" | "status" | "qr_code_url">,
): Promise<User | null> => {
  console.log("🔄 Supabase에 새 사용자 추가:", userData.name)

  try {
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          ...userData,
          status: "pending",
          qr_code_url: null,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("❌ 사용자 추가 실패:", error)
      return null
    }

    console.log("✅ 사용자 추가 성공:", data.name)
    return data
  } catch (error) {
    console.error("❌ 사용자 추가 중 예외 발생:", error)
    return null
  }
}

export const updateUserStatus = async (id: number, status: string): Promise<User | null> => {
  console.log(`🔄 사용자 ${id} 상태를 ${status}로 업데이트`)

  try {
    const updateData: any = { status }
    if (status === "approved") {
      updateData.qr_code_url = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/qr/${id}`
    }

    const { data, error } = await supabase.from("users").update(updateData).eq("id", id).select().single()

    if (error) {
      console.error("❌ 사용자 상태 업데이트 실패:", error)
      return null
    }

    // 퇴근완료 상태로 변경 시 출입 기록에 퇴근 시간 추가
    if (status === "completed") {
      await addCheckoutLog(id)
    }

    console.log("✅ 사용자 상태 업데이트 성공:", data.name)
    return data
  } catch (error) {
    console.error("❌ 사용자 상태 업데이트 중 예외 발생:", error)
    return null
  }
}

export const findUserByPhone = async (phone: string): Promise<User[]> => {
  console.log(`🔄 전화번호 ${phone}로 사용자 검색`)

  try {
    const { data, error } = await supabase.from("users").select("*").eq("phone", phone)

    if (error) {
      console.error("❌ 사용자 검색 실패:", error)
      return []
    }

    if (!data || data.length === 0) {
      console.log("ℹ️ 해당 전화번호의 사용자 없음")
      return []
    }

    console.log(`✅ 사용자 검색 성공: ${data.length}개 레코드 발견`)
    return data
  } catch (error) {
    console.error("❌ 사용자 검색 중 예외 발생:", error)
    return []
  }
}

export const findUserByPhoneAndConstructionPlan = async (
  phone: string,
  constructionPlanId: number | null,
): Promise<User | null> => {
  console.log(`🔄 전화번호 ${phone}와 공사계획 ${constructionPlanId}로 사용자 검색`)

  try {
    let query = supabase.from("users").select("*").eq("phone", phone)

    if (constructionPlanId) {
      query = query.eq("construction_plan_id", constructionPlanId)
    } else {
      query = query.is("construction_plan_id", null)
    }

    const { data, error } = await query.maybeSingle()

    if (error) {
      console.error("❌ 사용자 검색 실패:", error)
      return null
    }

    if (!data) {
      console.log("ℹ️ 해당 전화번호와 공사계획 조합의 사용자 없음")
      return null
    }

    console.log("✅ 사용자 검색 성공:", data.name, "공사계획:", data.construction_plan_id)
    return data
  } catch (error) {
    console.error("❌ 사용자 검색 중 예외 발생:", error)
    return null
  }
}

export const updateUser = async (id: number, updateData: Partial<User>): Promise<User | null> => {
  console.log(`🔄 사용자 ${id} 정보 업데이트`)

  try {
    const { data, error } = await supabase.from("users").update(updateData).eq("id", id).select().single()

    if (error) {
      console.error("❌ 사용자 정보 업데이트 실패:", error)
      return null
    }

    console.log("✅ 사용자 정보 업데이트 성공:", data.name)
    return data
  } catch (error) {
    console.error("❌ 사용자 정보 업데이트 중 예외 발생:", error)
    return null
  }
}

// 사용자 삭제 함수
export const deleteUser = async (id: number): Promise<{ success: boolean; error?: string }> => {
  console.log(`🔄 사용자 ${id} 삭제 시작`)

  try {
    // 먼저 해당 사용자의 출입 기록 삭제
    const { error: accessLogsError } = await supabase.from("access_logs").delete().eq("user_id", id)

    if (accessLogsError) {
      console.error("❌ 출입 기록 삭제 실패:", accessLogsError)
      return { success: false, error: "출입 기록 삭제에 실패했습니다." }
    }

    console.log("✅ 사용자의 출입 기록 삭제 완료")

    // 사용자 삭제
    const { error: userError } = await supabase.from("users").delete().eq("id", id)

    if (userError) {
      console.error("❌ 사용자 삭제 실패:", userError)
      return { success: false, error: "사용자 삭제에 실패했습니다." }
    }

    console.log("✅ 사용자 삭제 성공:", id)
    return { success: true }
  } catch (error) {
    console.error("❌ 사용자 삭제 중 예외 발생:", error)
    return { success: false, error: "사용자 삭제 중 오류가 발생했습니다." }
  }
}

// ========================================
// 공사계획 관련 함수들
// ========================================

export const getConstructionPlans = async (): Promise<ConstructionPlan[]> => {
  console.log("🔄 Supabase에서 공사계획 목록 조회 시작...")

  try {
    const { data, error } = await supabase
      .from("construction_plans")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ 공사계획 조회 실패:", error)

      // Supabase 연결 실패 시 로컬 스토리지 데이터 사용
      console.log("📝 Supabase 연결 실패로 로컬 스토리지 데이터를 사용합니다...")
      return getMockConstructionPlans()
    }

    console.log(`✅ 조회된 공사계획 수: ${data?.length || 0}개`)

    // 성공적으로 조회된 데이터를 로컬 스토리지에 저장
    if (data && data.length > 0) {
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem("construction_plans", JSON.stringify(data))
          console.log("💾 로컬 스토리지에 공사계획 데이터 동기화 완료")
        }
      } catch (storageError) {
        console.error("로컬 스토리지 동기화 실패:", storageError)
      }
    }

    return data || []
  } catch (error) {
    console.error("❌ 공사계획 조회 중 예외 발생:", error)

    // 예외 발생 시에도 로컬 스토리지 데이터 반환
    console.log("📝 예외 발생으로 로컬 스토리지 데이터를 사용합니다...")
    return getMockConstructionPlans()
  }
}

// 목업 데이터 함수
function getMockConstructionPlans(): ConstructionPlan[] {
  // 로컬 스토리지에서 저장된 공사계획 데이터를 가져오기
  try {
    if (typeof window !== "undefined") {
      const savedPlans = localStorage.getItem("construction_plans")
      if (savedPlans) {
        const parsedPlans = JSON.parse(savedPlans)
        console.log("📝 로컬 스토리지에서 공사계획 데이터 복원:", parsedPlans)
        return parsedPlans
      }
    }
  } catch (error) {
    console.error("로컬 스토리지에서 공사계획 데이터 복원 실패:", error)
  }

  // 기본 목업 데이터 (빈 배열 대신)
  return []
}

export const addConstructionPlan = async (
  planData: Omit<ConstructionPlan, "id" | "created_at">,
): Promise<ConstructionPlan | null> => {
  console.log("🔄 Supabase에 새 공사계획 추가:", planData.title)

  try {
    const { data, error } = await supabase.from("construction_plans").insert([planData]).select().single()

    if (error) {
      console.error("❌ 공사계획 추가 실패:", error)

      // Supabase 연결 실패 시 목업 응답 반환
      console.log("📝 목업 응답으로 대체합니다...")
      const mockPlan = createMockConstructionPlan(planData)

      // 로컬 스토리지에 저장
      saveToLocalStorage(mockPlan)

      return mockPlan
    }

    console.log("✅ 공사계획 추가 성공:", data.title)

    // 성공적으로 추가된 경우에도 로컬 스토리지에 저장
    saveToLocalStorage(data)

    return data
  } catch (error) {
    console.error("❌ 공사계획 추가 중 예외 발생:", error)

    // 예외 발생 시에도 목업 응답 반환
    console.log("📝 예외 처리로 목업 응답 반환...")
    const mockPlan = createMockConstructionPlan(planData)

    // 로컬 스토리지에 저장
    saveToLocalStorage(mockPlan)

    return mockPlan
  }
}

// 목업 공사계획 생성 함수
function createMockConstructionPlan(planData: Omit<ConstructionPlan, "id" | "created_at">): ConstructionPlan {
  return {
    id: Math.floor(Math.random() * 1000) + 100, // 임시 ID
    ...planData,
    created_at: new Date().toISOString(),
  }
}

// 로컬 스토리지에 공사계획 저장하는 헬퍼 함수
function saveToLocalStorage(newPlan: ConstructionPlan) {
  try {
    if (typeof window !== "undefined") {
      const existingPlans = localStorage.getItem("construction_plans")
      let plans: ConstructionPlan[] = []

      if (existingPlans) {
        plans = JSON.parse(existingPlans)
      }

      // 기존에 같은 ID가 있다면 업데이트, 없다면 추가
      const existingIndex = plans.findIndex((plan) => plan.id === newPlan.id)
      if (existingIndex >= 0) {
        plans[existingIndex] = newPlan
      } else {
        plans.unshift(newPlan) // 새 계획을 맨 앞에 추가
      }

      localStorage.setItem("construction_plans", JSON.stringify(plans))
      console.log("💾 로컬 스토리지에 공사계획 저장 완료:", newPlan.title)
    }
  } catch (error) {
    console.error("로컬 스토리지 저장 실패:", error)
  }
}

export const findConstructionPlanById = async (id: number): Promise<ConstructionPlan | null> => {
  console.log(`🔄 공사계획 ID ${id} 검색`)

  try {
    const { data, error } = await supabase.from("construction_plans").select("*").eq("id", id).single()

    if (error) {
      if (error.code === "PGRST116") {
        console.log("ℹ️ 해당 ID의 공사계획 없음")
        return null
      }
      console.error("❌ 공사계획 검색 실패:", error)
      return null
    }

    console.log("✅ 공사계획 검색 성공:", data.title)
    return data
  } catch (error) {
    console.error("❌ 공사계획 검색 중 예외 발생:", error)
    return null
  }
}

export const getConstructionPlanById = findConstructionPlanById

export const getActiveConstructionPlans = async (): Promise<ConstructionPlan[]> => {
  console.log("🔄 활성 공사계획 조회 시작...")

  try {
    const today = new Date().toISOString().split("T")[0] // YYYY-MM-DD 형식

    const { data, error } = await supabase
      .from("construction_plans")
      .select("*")
      .gte("end_date", today) // 종료일이 오늘 이후인 것만
      .order("start_date", { ascending: true })

    if (error) {
      console.error("❌ 활성 공사계획 조회 실패:", error)

      // Supabase 연결 실패 시 목업 데이터에서 활성 계획만 반환
      console.log("📝 목업 데이터로 대체합니다...")
      const mockPlans = getMockConstructionPlans()
      const todayDate = new Date(today)
      return mockPlans.filter((plan) => new Date(plan.end_date) >= todayDate)
    }

    console.log(`✅ 활성 공사계획 수: ${data?.length || 0}개`)
    return data || []
  } catch (error) {
    console.error("❌ 활성 공사계획 조회 중 예외 발생:", error)

    // 예외 발생 시에도 목업 데이터 반환
    console.log("📝 목업 데이터로 대체합니다...")
    const mockPlans = getMockConstructionPlans()
    const today = new Date().toISOString().split("T")[0]
    const todayDate = new Date(today)
    return mockPlans.filter((plan) => new Date(plan.end_date) >= todayDate)
  }
}

export const updateConstructionPlan = async (
  id: number,
  updateData: Partial<ConstructionPlan>,
): Promise<ConstructionPlan | null> => {
  console.log(`🔄 공사계획 ${id} 정보 업데이트`)

  try {
    const { data, error } = await supabase.from("construction_plans").update(updateData).eq("id", id).select().single()

    if (error) {
      console.error("❌ 공사계획 정보 업데이트 실패:", error)
      return null
    }

    console.log("✅ 공사계획 정보 업데이트 성공:", data.title)
    return data
  } catch (error) {
    console.error("❌ 공사계획 정보 업데이트 중 예외 발생:", error)
    return null
  }
}

export const deleteConstructionPlan = async (id: number): Promise<boolean> => {
  console.log(`🔄 공사계획 ${id} 삭제`)

  try {
    // 먼저 해당 공사계획에 연결된 사용자가 있는지 확인
    const { data: users, error: usersError } = await supabase.from("users").select("id").eq("construction_plan_id", id)

    if (usersError) {
      console.error("❌ 연결된 사용자 확인 실패:", usersError)
      return false
    }

    if (users && users.length > 0) {
      console.warn(`⚠️ 공사계획 ${id}에 ${users.length}명의 사용자가 연결되어 있어 삭제할 수 없습니다.`)
      return false
    }

    const { error } = await supabase.from("construction_plans").delete().eq("id", id)

    if (error) {
      console.error("❌ 공사계획 삭제 실패:", error)
      return false
    }

    console.log("✅ 공사계획 삭제 성공:", id)
    return true
  } catch (error) {
    console.error("❌ 공사계획 삭제 중 예외 발생:", error)
    return false
  }
}

// ========================================
// 관리자 관련 함수들
// ========================================

export const findAdminByUsername = async (username: string): Promise<Admin | null> => {
  console.log(`🔄 관리자 ${username} 검색`)

  try {
    const { data, error } = await supabase.from("admins").select("*").eq("username", username).single()

    if (error) {
      if (error.code === "PGRST116") {
        console.log("ℹ️ 해당 사용자명의 관리자 없음")
        return null
      }

      console.error("❌ 관리자 검색 실패:", error)
      return null
    }

    console.log("✅ 관리자 검색 성공:", data.username)
    return data
  } catch (error) {
    console.error("❌ 관리자 검색 중 예외 발생:", error)
    return null
  }
}

// ========================================
// 출입 기록 관련 함수들
// ========================================

export const addCheckoutLog = async (userId: number): Promise<boolean> => {
  console.log(`🔄 사용자 ${userId} 퇴근 기록 추가`)

  try {
    const { error } = await supabase.from("access_logs").insert([
      {
        user_id: userId,
        exit_time: new Date().toISOString(),
      },
    ])

    if (error) {
      console.error("❌ 퇴근 기록 추가 실패:", error)
      return false
    }

    console.log("✅ 퇴근 기록 추가 성공")
    return true
  } catch (error) {
    console.error("❌ 퇴근 기록 추가 중 예외 발생:", error)
    return false
  }
}

export const addEntryLog = async (userId: number): Promise<boolean> => {
  console.log(`🔄 사용자 ${userId} 출근 기록 추가`)

  try {
    const { error } = await supabase.from("access_logs").insert([
      {
        user_id: userId,
        entry_time: new Date().toISOString(),
      },
    ])

    if (error) {
      console.error("❌ 출근 기록 추가 실패:", error)
      return false
    }

    console.log("✅ 출근 기록 추가 성공")
    return true
  } catch (error) {
    console.error("❌ 출근 기록 추가 중 예외 발생:", error)
    return false
  }
}

export const addAccessLog = async (accessData: {
  user_id: number
  event_type: string
  timestamp: string
  qr_data?: string
}): Promise<boolean> => {
  console.log(`🔄 사용자 ${accessData.user_id} 출입 로그 추가 (${accessData.event_type})`)

  try {
    const { error } = await supabase.from("access_logs").insert([
      {
        user_id: accessData.user_id,
        entry_time: accessData.event_type === "check_in" ? accessData.timestamp : null,
        exit_time: accessData.event_type === "check_out" ? accessData.timestamp : null,
      },
    ])

    if (error) {
      console.error("❌ 출입 로그 추가 실패:", error)
      return false
    }

    console.log("✅ 출입 로그 추가 성공")
    return true
  } catch (error) {
    console.error("❌ 출입 로그 추가 중 예외 발생:", error)
    return false
  }
}

export const getAccessLogs = async (dateFilter?: string): Promise<AccessLog[]> => {
  console.log("🔄 출입 기록 조회 시작...")

  try {
    const targetDate = dateFilter || new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })).toISOString().split("T")[0]
    // KST 00:00:00 = UTC 전날 15:00:00, KST 23:59:59 = UTC 당일 14:59:59
    const startUTC = new Date(`${targetDate}T00:00:00+09:00`).toISOString()
    const endUTC = new Date(`${targetDate}T23:59:59+09:00`).toISOString()
    console.log(`📅 조회 날짜: ${targetDate} (UTC: ${startUTC} ~ ${endUTC})`)
    const { data, error } = await supabase
      .from("access_logs")
      .select("*")
      .gte("created_at", startUTC)
      .lte("created_at", endUTC)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ 출입 기록 조회 실패:", error)
      return []
    }

    console.log(`✅ 조회된 출입 기록 수: ${data?.length || 0}개`)
    return data || []
  } catch (error) {
    console.error("❌ 출입 기록 조회 중 예외 발생:", error)
    return []
  }
}

export const getAccessLogsRange = async (startDate: string, endDate: string): Promise<AccessLog[]> => {
  console.log(`🔄 출입 기록 범위 조회: ${startDate} ~ ${endDate}`)

  try {
    const startUTC = new Date(`${startDate}T00:00:00+09:00`).toISOString()
    const endUTC = new Date(`${endDate}T23:59:59+09:00`).toISOString()
    const { data, error } = await supabase
      .from("access_logs")
      .select("user_id, entry_time, exit_time, created_at")
      .gte("created_at", startUTC)
      .lte("created_at", endUTC)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ 출입 기록 범위 조회 실패:", error)
      return []
    }

    console.log(`✅ 범위 조회 출입 기록: ${data?.length || 0}개`)
    return data || []
  } catch (error) {
    console.error("❌ 출입 기록 범위 조회 예외:", error)
    return []
  }
}

export const getUserLatestAccessLog = async (userId: number): Promise<AccessLog | null> => {
  console.log(`🔄 사용자 ${userId}의 최근 출입 기록 조회`)

  try {
    const { data, error } = await supabase
      .from("access_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // No records found
        console.log(`ℹ️ 사용자 ${userId}의 출입 기록이 없습니다`)
        return null
      }
      console.error("❌ 최근 출입 기록 조회 실패:", error)
      return null
    }

    console.log(`✅ 사용자 ${userId}의 최근 출입 기록 조회 성공`)
    return data
  } catch (error) {
    console.error("❌ 최근 출입 기록 조회 중 예외 발생:", error)
    return null
  }
}

export const updateAccessLogWithExit = async (logId: number): Promise<boolean> => {
  console.log(`🔄 출입 로그 ${logId} 퇴근 시간 업데이트`)

  try {
    const now = new Date()

    console.log("[v0] 현재 UTC 시간:", now.toISOString())

    const { error } = await supabase.from("access_logs").update({ exit_time: now.toISOString() }).eq("id", logId)

    if (error) {
      console.error("❌ 퇴근 시간 업데이트 실패:", error)
      return false
    }

    console.log("✅ 퇴근 시간 업데이트 성공:", now.toISOString())
    return true
  } catch (error) {
    console.error("❌ 퇴근 시간 업데이트 중 예외 발생:", error)
    return false
  }
}

// ========================================
// 통계 관련 함수들
// ========================================

export const getUserStats = async () => {
  console.log("🔄 사용자 통계 조회 시작...")

  try {
    const { data, error } = await supabase.from("users").select("status")

    if (error) {
      console.error("❌ 통계 조회 실패:", error)
      return {
        pending: 0,
        approved: 0,
        completed: 0,
        rejected: 0,
      }
    }

    if (!data || data.length === 0) {
      console.log("ℹ️ 사용자 데이터가 없습니다.")
      return {
        pending: 0,
        approved: 0,
        completed: 0,
        rejected: 0,
      }
    }

    const stats = data.reduce(
      (acc, user) => {
        acc[user.status] = (acc[user.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    console.log("✅ 통계 조회 성공:", stats)
    return {
      pending: stats.pending || 0,
      approved: stats.approved || 0,
      completed: stats.completed || 0,
      rejected: stats.rejected || 0,
    }
  } catch (error) {
    console.error("❌ 통계 조회 중 예외 발생:", error)
    return {
      pending: 0,
      approved: 0,
      completed: 0,
      rejected: 0,
    }
  }
}

export const getAccessStatistics = async (): Promise<AccessStatistics> => {
  console.log("🔄 상세 출입 통계 조회 시작...")

  try {
    // 사용자와 공사계획 조인 쿼리
    const { data: usersWithPlans, error: usersError } = await supabase.from("users").select(`
        *,
        construction_plan:construction_plans(
          id,
          title,
          company,
          site_manager,
          start_date,
          end_date,
          status
        )
      `)

    if (usersError) {
      console.error("❌ 사용자 데이터 조회 실패:", usersError)
      throw usersError
    }

    const { data: allPlans, error: plansError } = await supabase.from("construction_plans").select("*")

    if (plansError) {
      console.error("❌ 공사계획 데이터 조회 실패:", plansError)
      throw plansError
    }

    const users = usersWithPlans || []
    const plans = allPlans || []

    // 기본 통계
    const totalUsers = users.length
    const uniqueCompanies = new Set(plans.map((plan) => plan.company))
    const totalCompanies = uniqueCompanies.size
    const totalProjects = plans.length

    // 상태별 분류
    const statusBreakdown = users.reduce(
      (acc, user) => {
        acc[user.status] = (acc[user.status] || 0) + 1
        return acc
      },
      { pending: 0, approved: 0, completed: 0, rejected: 0 },
    )

    // 업체별 분류
    const companyStats = users.reduce(
      (acc, user) => {
        const company = user.construction_plan?.company || "미지정"
        acc[company] = (acc[company] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const companyBreakdown = Object.entries(companyStats)
      .map(([company, count]) => ({
        company,
        count,
        percentage: totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)

    // 프로젝트별 분류
    const projectStats = users.reduce(
      (acc, user) => {
        const projectTitle = user.construction_plan?.title || "미지정"
        const company = user.construction_plan?.company || "미지정"
        const key = `${projectTitle}|${company}`
        acc[key] = (acc[key] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const projectBreakdown = Object.entries(projectStats)
      .map(([key, count]) => {
        const [project, company] = key.split("|")
        return {
          project,
          company,
          count,
          percentage: totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0,
        }
      })
      .sort((a, b) => b.count - a.count)

    // 역할별 분류
    const roleBreakdown = users.reduce(
      (acc, user) => {
        if (user.roles?.site_manager) acc.siteManagers++
        if (user.roles?.vehicle_owner) acc.vehicleOwners++
        if (!user.roles?.site_manager && !user.roles?.vehicle_owner) acc.generalWorkers++
        return acc
      },
      { siteManagers: 0, vehicleOwners: 0, generalWorkers: 0 },
    )

    // 국적별 분류
    const nationalityBreakdown = users.reduce(
      (acc, user) => {
        if (user.nationality === "KR") {
          acc.domestic++
        } else {
          acc.foreign++
        }
        return acc
      },
      { domestic: 0, foreign: 0 },
    )

    // 일별 통계 (최근 7일)
    const dailyStats = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]

      const registrations = users.filter((user) => user.created_at.startsWith(dateStr)).length
      const approvals = users.filter((user) => user.status === "approved" && user.created_at.startsWith(dateStr)).length

      dailyStats.push({
        date: dateStr,
        registrations,
        approvals,
      })
    }

    const statistics: AccessStatistics = {
      totalUsers,
      totalCompanies,
      totalProjects,
      statusBreakdown,
      companyBreakdown,
      projectBreakdown,
      roleBreakdown,
      nationalityBreakdown,
      dailyStats,
    }

    console.log("✅ 상세 통계 조회 성공")
    return statistics
  } catch (error) {
    console.error("❌ 상세 통계 조회 중 예외 발생:", error)

    // 에러 시 기본값 반환
    return {
      totalUsers: 0,
      totalCompanies: 0,
      totalProjects: 0,
      statusBreakdown: { pending: 0, approved: 0, completed: 0, rejected: 0 },
      companyBreakdown: [],
      projectBreakdown: [],
      roleBreakdown: { siteManagers: 0, vehicleOwners: 0, generalWorkers: 0 },
      nationalityBreakdown: { domestic: 0, foreign: 0 },
      dailyStats: [],
    }
  }
}

// 공사계획별 상세 통계 조회
export const getConstructionPlanStatistics = async (constructionPlanId: number) => {
  console.log(`🔄 공사계획 ID ${constructionPlanId} 상세 통계 조회 시작`)

  try {
    // 해당 공사계획 정보 조회
    const constructionPlan = await findConstructionPlanById(constructionPlanId)
    if (!constructionPlan) {
      throw new Error("공사계획을 찾을 수 없습니다.")
    }

    // 해당 공사계획에 속한 사용자들 조회
    const users = await getUsersByConstructionPlan(constructionPlanId)

    // 기본 통계
    const totalUsers = users.length
    const statusBreakdown = users.reduce(
      (acc, user) => {
        acc[user.status as keyof typeof acc]++
        return acc
      },
      { pending: 0, approved: 0, completed: 0, rejected: 0 },
    )

    // 역할별 분류
    const roleBreakdown = users.reduce(
      (acc, user) => {
        if (user.roles?.site_manager) acc.siteManagers++
        if (user.roles?.vehicle_owner) acc.vehicleOwners++
        if (!user.roles?.site_manager && !user.roles?.vehicle_owner) acc.generalWorkers++
        return acc
      },
      { siteManagers: 0, vehicleOwners: 0, generalWorkers: 0 },
    )

    // 국적별 분류
    const nationalityBreakdown = users.reduce(
      (acc, user) => {
        if (user.nationality === "KR") {
          acc.domestic++
        } else {
          acc.foreign++
        }
        return acc
      },
      { domestic: 0, foreign: 0 },
    )

    // 일별 통계 (최근 7일)
    const dailyStats = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]

      const registrations = users.filter((user) => user.created_at.startsWith(dateStr)).length
      const approvals = users.filter((user) => user.status === "approved" && user.created_at.startsWith(dateStr)).length

      dailyStats.push({
        date: dateStr,
        registrations,
        approvals,
      })
    }

    const statistics = {
      constructionPlan: {
        id: constructionPlan.id,
        title: constructionPlan.title,
        company: constructionPlan.company,
        siteManager: constructionPlan.site_manager,
        supervisor: constructionPlan.supervisor,
        startDate: constructionPlan.start_date,
        endDate: constructionPlan.end_date,
        status: constructionPlan.status,
      },
      totalUsers,
      statusBreakdown,
      roleBreakdown,
      nationalityBreakdown,
      dailyStats,
      users, // 사용자 목록도 포함
    }

    console.log(`✅ 공사계획 ${constructionPlan.title} 통계 조회 성공 (총 ${totalUsers}명)`)
    return statistics
  } catch (error) {
    console.error("❌ 공사계획별 통계 조회 중 예외 발생:", error)
    return null
  }
}

// ========================================
// 테이블 존재 확인 함수
// ========================================

export const checkTablesExist = async () => {
  try {
    // 각 테이블에 직접 쿼리를 시도해서 존재 여부 확인
    const tableChecks = await Promise.allSettled([
      supabase.from("users").select("id").limit(1),
      supabase.from("construction_plans").select("id").limit(1),
      supabase.from("admins").select("id").limit(1),
      supabase.from("access_logs").select("id").limit(1),
    ])

    const results = tableChecks.map((result, index) => {
      const tableNames = ["users", "construction_plans", "admins", "access_logs"]
      if (result.status === "fulfilled") {
        return { table: tableNames[index], exists: !result.value.error }
      } else {
        return { table: tableNames[index], exists: false }
      }
    })

    const allExist = results.every((result) => result.exists)
    const missingTables = results.filter((result) => !result.exists).map((result) => result.table)

    if (missingTables.length > 0) {
      console.warn("⚠️ 누락된 테이블:", missingTables)
    }

    console.log("✅ 테이블 존재 확인 결과:", results)
    return allExist
  } catch (error) {
    console.error("❌ 테이블 확인 중 오류:", error)
    return false
  }
}
