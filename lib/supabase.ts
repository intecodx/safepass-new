import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
})

// 데이터베이스 연결 테스트
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from("users").select("count").limit(1)

    if (error) {
      console.error("Supabase 연결 실패:", error)
      return { success: false, error: error.message }
    }

    console.log("✅ Supabase 연결 성공")
    return { success: true, message: "Supabase 연결 성공" }
  } catch (error: any) {
    console.error("Supabase 연결 오류:", error)
    return { success: false, error: error.message }
  }
}

// 데이터베이스 상태 확인
export async function checkDatabaseStatus() {
  try {
    const connectionTest = await testSupabaseConnection()

    if (!connectionTest.success) {
      return {
        status: "error",
        message: "데이터베이스 연결에 실패했습니다.",
        details: connectionTest.error,
      }
    }

    // 기본 데이터 확인
    const { data: plans } = await supabase.from("construction_plans").select("*").limit(1)
    const { data: users } = await supabase.from("users").select("*").limit(1)

    return {
      status: "ready",
      message: "데이터베이스가 정상적으로 연결되었습니다.",
      data: {
        construction_plans: plans?.length || 0,
        users: users?.length || 0,
      },
    }
  } catch (error: any) {
    return {
      status: "error",
      message: "데이터베이스 상태 확인 중 오류가 발생했습니다.",
      details: error.message,
    }
  }
}
