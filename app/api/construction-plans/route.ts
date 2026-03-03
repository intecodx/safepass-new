// app/api/construction-plans/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { getActiveConstructionPlans } from "@/lib/supabase-storage";
import {
  getActiveConstructionPlans as getActiveConstructionPlansMemory,
} from "@/lib/construction-plans-storage";

// ✅ 캐시 무력화(서버/빌드/플랫폼 전부 동적 처리)
export const dynamic = "force-dynamic";
export const revalidate = 0;

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0, must-revalidate",
  // 필요시 아래도 추가해도 됨(선택):
  // "Vercel-CDN-Cache-Control": "no-store",
  // "CDN-Cache-Control": "no-store",
};

// GET: 활성 공사계획 가져오기(외부문서 기준) + 메모리 폴백
export async function GET() {
  try {
    console.log("🔎 활성 공사계획 조회 시작...");
    const plansFromSupabase = await getActiveConstructionPlans();

    if (Array.isArray(plansFromSupabase) && plansFromSupabase.length > 0) {
      console.log("✅ Supabase 결과:", plansFromSupabase.length);
      return NextResponse.json(plansFromSupabase, { headers: noStoreHeaders }); // ← no-store
    }

    console.log("ℹ️ Supabase 비어있음. 메모리 폴백 사용");
    const plansFromMemory = getActiveConstructionPlansMemory();
    return NextResponse.json(plansFromMemory, { headers: noStoreHeaders }); // ← no-store
  } catch (error) {
    console.error("❌ 공사계획 조회 실패:", error);
    try {
      const plansFromMemory = getActiveConstructionPlansMemory();
      return NextResponse.json(plansFromMemory, { headers: noStoreHeaders }); // ← no-store
    } catch (_) {
      return NextResponse.json(
        {
          error: "공사계획 조회 중 오류가 발생했습니다.",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500, headers: noStoreHeaders } // ← no-store
      );
    }
  }
}
