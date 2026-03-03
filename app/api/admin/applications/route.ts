import { NextResponse } from "next/server"
import { getUsers, getConstructionPlans, getAccessLogs } from "@/lib/supabase-storage"

export const dynamic = "force-dynamic"
export const revalidate = 0

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

export async function GET() {
  try {
    console.log("🚀 관리자 신청 목록 조회 시작...")

    console.log("📊 실시간 데이터베이스 상태 확인 중...")

    const allConstructionPlans = await getConstructionPlans()
    console.log(`🏗️ 현재 등록된 공사계획: ${allConstructionPlans.length}개`)

    const intecoConstructionPlans = allConstructionPlans.filter((plan) => plan.company !== "WIE")
    console.log(`🏗️ INTECO 공사계획: ${intecoConstructionPlans.length}개`)

    const registeredUsers = await getUsers()
    console.log(`👥 현재 등록된 사용자: ${registeredUsers.length}명`)

    const intecoConstructionPlanIds = new Set(intecoConstructionPlans.map((plan) => plan.id))
    const intecoUsers = registeredUsers.filter(
      (user) => user.construction_plan_id && intecoConstructionPlanIds.has(user.construction_plan_id),
    )
    console.log(`👥 INTECO 사용자: ${intecoUsers.length}명`)

    const accessLogs = await getAccessLogs()
    console.log(`📋 출입 로그: ${accessLogs.length}개`)

    const sortedUsers = intecoUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    console.log("🕐 최근 등록 순서로 사용자 목록:")
    sortedUsers.slice(0, 10).forEach((user, index) => {
      const timeDiff = new Date().getTime() - new Date(user.created_at).getTime()
      const minutesAgo = Math.floor(timeDiff / (1000 * 60))
      console.log(`  ${index + 1}. ${user.name} (${minutesAgo}분 전 등록, 공사계획 ID: ${user.construction_plan_id})`)
    })

    if (intecoConstructionPlans.length === 0) {
      console.log("⚠️ INTECO 공사계획이 없습니다. 먼저 공사계획을 생성해주세요!")
    }

    if (sortedUsers.length === 0) {
      console.log("⚠️ INTECO 등록된 사용자가 없습니다. 출입신청을 해주세요!")
      return NextResponse.json([], { headers: noStoreHeaders })
    }

    console.log("📋 등록된 INTECO 공사계획 목록:")
    intecoConstructionPlans.forEach((plan, index) => {
      console.log(`  ${index + 1}. ID: ${plan.id}, 제목: "${plan.title}", 회사: "${plan.company}"`)
    })

    console.log("👥 사용자별 상세 정보:")
    sortedUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. 사용자 ID: ${user.id}`)
      console.log(`     이름: ${user.name}`)
      console.log(`     전화번호: ${user.phone}`)
      console.log(`     construction_plan_id: ${user.construction_plan_id}`)
      console.log(`     상태: ${user.status}`)
      console.log(`     등록일: ${user.created_at}`)

      if (user.construction_plan_id) {
        const matchingPlan = intecoConstructionPlans.find((p) => p.id === user.construction_plan_id)
        if (matchingPlan) {
          console.log(`     ✅ 연결된 공사계획: "${matchingPlan.title}" (${matchingPlan.company})`)
        } else {
          console.log(`     ❌ 공사계획 ID ${user.construction_plan_id}에 해당하는 공사계획을 찾을 수 없음`)
        }
      } else {
        console.log(`     ℹ️ 공사계획 미지정`)
      }
      console.log(`     ---`)
    })

    const applicationsWithPlans = sortedUsers.map((user) => {
      console.log(`🔄 사용자 ${user.id} (${user.name}) 공사계획 연결 처리 중...`)

      const constructionPlan = user.construction_plan_id
        ? intecoConstructionPlans.find((plan) => plan.id === user.construction_plan_id)
        : null

      const userAccessLog = accessLogs.find((log) => log.user_id === user.id)
      const hasEntryLog = userAccessLog && userAccessLog.entry_time !== null
      const hasExitLog = userAccessLog && userAccessLog.exit_time !== null

      let workEntryCompleted = false
      let workExitCompleted = false
      let entryTime: string | undefined
      let exitTime: string | undefined

      if (hasEntryLog && userAccessLog.entry_time) {
        workEntryCompleted = true
        entryTime = userAccessLog.entry_time
      }

      if (hasExitLog && userAccessLog.exit_time) {
        workExitCompleted = true
        exitTime = userAccessLog.exit_time
      }

      if (user.construction_plan_id) {
        if (constructionPlan) {
          console.log(
            `✅ 사용자 ${user.id} 공사계획 연결 성공: "${constructionPlan.title}" (${constructionPlan.company})`,
          )
        } else {
          console.log(
            `❌ 사용자 ${user.id} 공사계획 연결 실패: ID ${user.construction_plan_id}에 해당하는 공사계획 없음`,
          )
        }
      } else {
        console.log(`ℹ️ 사용자 ${user.id} 공사계획 미지정`)
      }

      const applicationData = {
        id: user.id,
        name: user.name,
        phone: user.phone,
        nationality: user.nationality,
        passport_number: user.passport_number,
        birth_date: user.birth_date,
        gender: user.gender,
        status: user.status,
        construction_plan: constructionPlan
          ? {
              id: constructionPlan.id,
              title: constructionPlan.title,
              company: constructionPlan.company,
              work_company: constructionPlan.work_company,
            }
          : null,
        roles: user.roles,
        vehicle_info: user.vehicle_info,
        created_at: user.created_at,
        work_status: {
          entry_completed: workEntryCompleted,
          exit_completed: workExitCompleted,
          today_logs_count: (hasEntryLog ? 1 : 0) + (hasExitLog ? 1 : 0),
          entry_time: entryTime,
          exit_time: exitTime,
        },
      }

      return applicationData
    })

    const withPlans = applicationsWithPlans.filter((app) => app.construction_plan !== null)
    const withoutPlans = applicationsWithPlans.filter((app) => app.construction_plan === null)

    console.log(`📊 최종 결과 통계:`)
    console.log(`- 공사계획 연결된 사용자: ${withPlans.length}명`)
    console.log(`- 공사계획 미연결 사용자: ${withoutPlans.length}명`)
    console.log(`- 전체 반환할 신청 목록: ${applicationsWithPlans.length}개`)

    const planGroups = withPlans.reduce(
      (acc, app) => {
        const planTitle = app.construction_plan!.title
        if (!acc[planTitle]) {
          acc[planTitle] = []
        }
        acc[planTitle].push(app.name)
        return acc
      },
      {} as Record<string, string[]>,
    )

    console.log(`📋 공사계획별 신청자 목록:`)
    Object.entries(planGroups).forEach(([planTitle, users]) => {
      console.log(`  "${planTitle}": ${users.length}명 - ${users.join(", ")}`)
    })

    if (withoutPlans.length > 0) {
      console.log(`❗ 공사계획이 없는 사용자들:`)
      withoutPlans.forEach((app) => {
        console.log(`  - ${app.name} (ID: ${app.id}, 전화: ${app.phone})`)
      })
    }

    console.log(`🎯 최종 반환 데이터 샘플 (첫 5개):`)
    applicationsWithPlans.slice(0, 5).forEach((app, index) => {
      console.log(`  ${index + 1}. ${app.name} - 공사계획: ${app.construction_plan?.title || "미지정"}`)
    })

    return NextResponse.json(applicationsWithPlans, { headers: noStoreHeaders })
  } catch (error) {
    console.error("❌ 신청 목록 조회 실패:", error)
    return NextResponse.json({ error: "신청 목록을 불러올 수 없습니다." }, { status: 500, headers: noStoreHeaders })
  }
}
