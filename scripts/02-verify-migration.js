// 마이그레이션 검증 스크립트
// Node.js로 실행: node scripts/02-verify-migration.js

const { createClient } = require("@supabase/supabase-js")

const supabaseUrl = "https://cxpgcrljdsngggxfeslg.supabase.co"
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4cGdjcmxqZHNuZ2dneGZlc2xnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNTUxMjUsImV4cCI6MjA2OTkzMTEyNX0.gTlSgG25BWaQCL4eWKNsvuyMpDRrIrt8Gr_fHSyG3yw"

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyMigration() {
  console.log("🔍 마이그레이션 검증 시작...\n")

  const tables = ["construction_plans", "users", "admins", "access_logs"]

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase.from(table).select("*", { count: "exact" })

      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
      } else {
        console.log(`✅ ${table}: ${count}개 레코드`)
        if (data && data.length > 0) {
          console.log(`   샘플: ${JSON.stringify(data[0], null, 2).substring(0, 100)}...`)
        }
      }
    } catch (err) {
      console.log(`💥 ${table}: ${err.message}`)
    }
    console.log("")
  }

  // 관계 테스트
  console.log("🔗 관계 테스트...")
  try {
    const { data, error } = await supabase
      .from("users")
      .select(`
        name,
        phone,
        construction_plan:construction_plans(title, company)
      `)
      .limit(3)

    if (error) {
      console.log("❌ 관계 조회 실패:", error.message)
    } else {
      console.log("✅ 관계 조회 성공:")
      console.log(JSON.stringify(data, null, 2))
    }
  } catch (err) {
    console.log("💥 관계 테스트 실패:", err.message)
  }

  console.log("\n🎉 검증 완료!")
}

verifyMigration()
