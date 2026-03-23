"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, ChevronLeft, ChevronRight, LogOut, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export const dynamic = "force-dynamic"

const KST = "Asia/Seoul" as const

/** ===================== 시간 유틸 ===================== **/

function parseAsUTC(input: string | number): Date {
  if (!input) return new Date(Number.NaN)

  // If input is a number or numeric string, treat it as a timestamp
  if (typeof input === "number") {
    return new Date(input)
  }

  // Check if string is a numeric timestamp
  const numericValue = Number(input)
  if (!isNaN(numericValue) && input.length > 10) {
    // Likely a timestamp in milliseconds
    return new Date(numericValue)
  }

  // Otherwise treat as ISO date string
  const date = new Date(input)
  if (isNaN(date.getTime())) {
    console.error("[v0] Invalid date string:", input)
    return new Date(Number.NaN)
  }
  return date
}

function formatKSTTime(input: number | Date | string) {
  const d = input instanceof Date ? input : parseAsUTC(input)
  if (isNaN(d.getTime())) {
    return "-"
  }
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: KST,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d)
}

function formatKSTDateLabel(input: number | Date | string) {
  const d = input instanceof Date ? input : parseAsUTC(input)
  if (isNaN(d.getTime())) {
    return "-"
  }
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: KST,
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d)
}

function ymdKST(input: number | Date | string) {
  const d = input instanceof Date ? input : parseAsUTC(input)
  if (isNaN(d.getTime())) {
    return ""
  }
  const s = new Intl.DateTimeFormat("ko-KR", {
    timeZone: KST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d)
  return s
    .replace(/\./g, "")
    .replace(/\s/g, "")
    .replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3")
}

function getTodayKST(): string {
  const now = new Date()
  const kstDate = new Intl.DateTimeFormat("ko-KR", {
    timeZone: KST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now)

  // Convert "2025. 10. 28." to "2025-10-28"
  return kstDate
    .replace(/\./g, "")
    .replace(/\s/g, "")
    .replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3")
}

/** ===================== 타입 ===================== **/

interface Application {
  id: number
  name: string
  phone: string
  nationality: string
  birth_date: string
  gender: string
  status: string
  roles?: any
  vehicle_info?: any
  construction_plan: {
    id: number
    title: string
    company: string
    end_date: string
  } | null
  created_at: string
}

interface EntryRecord {
  id: number
  time: string
  date: string
  applicant: string
  details: string
  contact: string
  status: string
  application: Application
  entryCompleted?: boolean
  ts: number // 정렬/통계용 타임스탬프(ms)
  entryTime: string
  exitTime: string
}

/** ===================== 컴포넌트 ===================== **/

export default function WieSecurityDashboard() {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayKST())
  const [currentPersonnel, setCurrentPersonnel] = useState(0)
  const [todayDeparted, setTodayDeparted] = useState(0)
  const [entryRecords, setEntryRecords] = useState<EntryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedPlan, setSelectedPlan] = useState<string>("all")
  const [constructionPlans, setConstructionPlans] = useState<{ id: number; title: string }[]>([])
  const recordsPerPage = 10

  useEffect(() => {
    const updateDate = () => {
      const today = getTodayKST()
      setSelectedDate(today)
    }
    const interval = setInterval(updateDate, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    loadDashboardData()
    const interval = setInterval(loadDashboardData, 60000) // 60초 (기존 2초→트래픽 30배 절감)
    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    try {
      const response = await fetch("/api/wie-security/applications")
      const applications: Application[] = await response.json()
      const approvedApplications = applications.filter((app) => app.status === "approved")

      let accessLogs: any[] = []
      try {
        const accessResponse = await fetch("/api/wie-security/access-logs")
        if (accessResponse.ok) {
          accessLogs = await accessResponse.json()
        }
      } catch (error) {
        console.log("[v0] 출입 로그 로딩 실패:", error)
      }

      accessLogs.sort((a, b) => {
        const timeA = new Date(a.created_at || 0).getTime()
        const timeB = new Date(b.created_at || 0).getTime()
        return timeB - timeA
      })

      const todayKST = getTodayKST()
      const uniquePlans = Array.from(
        new Map(
          approvedApplications
            .filter((app) => app.construction_plan)
            .filter((app) => {
              const endDate = app.construction_plan!.end_date
              return endDate >= todayKST
            })
            .map((app) => [
              app.construction_plan!.id,
              { id: app.construction_plan!.id, title: app.construction_plan!.title },
            ]),
        ).values(),
      )
      setConstructionPlans(uniquePlans)

      const records: EntryRecord[] = approvedApplications
        .filter((app) => {
          const userAccessLog = accessLogs.find((log) => log.user_id === app.id)
          return userAccessLog && (userAccessLog.entry_time !== null || userAccessLog.exit_time !== null)
        })
        .map((app) => {
          const userAccessLog = accessLogs.find((log) => log.user_id === app.id)
          const hasEntryLog = userAccessLog && userAccessLog.entry_time !== null
          const hasExitLog = userAccessLog && userAccessLog.exit_time !== null

          const entryTime =
            hasEntryLog && userAccessLog.entry_time ? formatKSTTime(parseAsUTC(userAccessLog.entry_time)) : "-"

          const exitTime =
            hasExitLog && userAccessLog.exit_time ? formatKSTTime(parseAsUTC(userAccessLog.exit_time)) : "-"

          let displayTime: Date
          if (hasExitLog && userAccessLog.exit_time) {
            displayTime = parseAsUTC(userAccessLog.exit_time)
          } else if (hasEntryLog && userAccessLog.entry_time) {
            displayTime = parseAsUTC(userAccessLog.entry_time)
          } else {
            displayTime = parseAsUTC(app.created_at)
          }

          const ts = displayTime.getTime()
          if (isNaN(ts)) {
            console.error("[v0] Invalid timestamp for user:", app.name, "using current time as fallback")
            displayTime = new Date()
          }

          let status = "입장가능"
          if (hasEntryLog && hasExitLog) {
            status = "퇴근완료"
          } else if (hasEntryLog) {
            status = "출입완료"
          }

          return {
            id: app.id,
            time: formatKSTTime(displayTime),
            date: formatKSTDateLabel(displayTime),
            applicant: app.name,
            details: app.construction_plan?.title || "공사계획 미지정",
            contact: app.phone,
            status,
            application: app,
            entryCompleted: hasEntryLog,
            ts: displayTime.getTime(),
            entryTime,
            exitTime,
          }
        })

      records.sort((a, b) => b.ts - a.ts)

      setEntryRecords(records)
      setCurrentPersonnel(records.filter((r) => r.status === "출입완료").length)
      setTodayDeparted(records.filter((r) => r.status === "퇴근완료").length)
    } catch (error) {
      console.error("[v0] WIE 경비실 대시보드 데이터 로딩 실패:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRecords = entryRecords.filter((record) => {
    // Filter by construction plan
    if (selectedPlan !== "all" && record.application.construction_plan?.id.toString() !== selectedPlan) {
      return false
    }

    // Filter by selected date - check if entry_time or exit_time matches selected date
    const recordDate = ymdKST(record.ts)
    return recordDate === selectedDate
  })

  const dateFilteredRecords = entryRecords.filter((record) => {
    const recordDate = ymdKST(record.ts)
    return recordDate === selectedDate
  })

  const currentPersonnelCount = dateFilteredRecords.filter((r) => r.status === "출입완료").length
  const todayDepartedCount = dateFilteredRecords.filter((r) => r.status === "퇴근완료").length

  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage)
  const startIndex = (currentPage - 1) * recordsPerPage
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + recordsPerPage)

  const generateChartData = () => {
    const chartData: Array<{ date: string; 출근: number; 퇴근: number; 총출입: number }> = []

    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)

      const dateLabel = new Intl.DateTimeFormat("ko-KR", {
        timeZone: KST,
        month: "short",
        day: "numeric",
      }).format(d)

      const targetKey = ymdKST(d)

      const dayRecords = entryRecords.filter((r) => r.entryCompleted && ymdKST(r.ts) === targetKey)

      const entryCount = dayRecords.filter((r) => r.status === "출입완료" || r.status === "퇴근완료").length
      const exitCount = dayRecords.filter((r) => r.status === "퇴근완료").length

      chartData.push({
        date: dateLabel,
        출근: entryCount,
        퇴근: exitCount,
        총출입: entryCount,
      })
    }

    return chartData
  }

  const chartData = generateChartData()

  const weeklyStats = {
    totalEntry: chartData.reduce((sum, day) => sum + day.출근, 0),
    totalExit: chartData.reduce((sum, day) => sum + day.퇴근, 0),
    avgDaily: Math.round(chartData.reduce((sum, day) => sum + day.출근, 0) / 7),
    peakDay: chartData.reduce((max, day) => (day.출근 > max.출근 ? day : max), chartData[0]),
  }

  const getRoleIndicators = (application: Application) => {
    const indicators = []

    // Check if user is site representative (현장대리인)
    if (application.roles) {
      try {
        const rolesData = typeof application.roles === "string" ? JSON.parse(application.roles) : application.roles
        if (rolesData.site_manager === true) {
          indicators.push("현장대리인")
        }
      } catch (error) {
        // If roles is not JSON, check if it's an array or object
        if (Array.isArray(application.roles)) {
          if (application.roles.includes("site_representative") || application.roles.includes("현장대리인")) {
            indicators.push("현장대리인")
          }
        } else if (typeof application.roles === "object" && application.roles.site_manager) {
          indicators.push("현장대리인")
        }
      }
    }

    // Check if user is vehicle owner (차량소유자)
    if (application.vehicle_info) {
      try {
        const vehicleInfo =
          typeof application.vehicle_info === "string" ? JSON.parse(application.vehicle_info) : application.vehicle_info

        // If vehicle info exists, assume they are the owner
        if (vehicleInfo && (vehicleInfo.number || vehicleInfo.type)) {
          indicators.push("차량소유자")
        }
      } catch (error) {
        // If vehicle_info exists but can't be parsed, assume they are the owner
        indicators.push("차량소유자")
      }
    }

    if (application.roles) {
      try {
        const rolesData = typeof application.roles === "string" ? JSON.parse(application.roles) : application.roles
        if (rolesData.vehicle_owner === true) {
          // Only add if not already added from vehicle_info
          if (!indicators.includes("차량소유자")) {
            indicators.push("차량소유자")
          }
        }
      } catch (error) {
        // Handle parsing errors silently
      }
    }

    return indicators
  }

  const getVehicleNumber = (application: Application) => {
    if (!application.vehicle_info) return null

    try {
      const vehicleInfo =
        typeof application.vehicle_info === "string" ? JSON.parse(application.vehicle_info) : application.vehicle_info

      return vehicleInfo?.number || null
    } catch (error) {
      return null
    }
  }

  const handleManualExit = async (userId: number, userName: string) => {
    const confirmed = window.confirm(`${userName}님의 퇴근처리 하시겠습니까?`)

    if (!confirmed) {
      return
    }

    try {
      const response = await fetch("/api/wie-security/manual-exit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      const result = await response.json()

      if (result.success) {
        alert(result.message)
        await loadDashboardData()
      } else {
        alert(`퇴근처리 실패: ${result.error}`)
      }
    } catch (error) {
      console.error("[v0] 수동 퇴근처리 오류:", error)
      alert("퇴근처리 중 오류가 발생했습니다")
    }
  }

  const handleManualReentry = async (userId: number, userName: string) => {
    const confirmed = window.confirm(`${userName}님의 재출근처리 하시겠습니까?`)

    if (!confirmed) {
      return
    }

    try {
      const response = await fetch("/api/wie-security/manual-reentry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      const result = await response.json()

      if (result.success) {
        alert(result.message)
        await loadDashboardData()
      } else {
        alert(`재출근처리 실패: ${result.error}`)
      }
    } catch (error) {
      console.error("[v0] 수동 재출근처리 오류:", error)
      alert("재출근처리 중 오류가 발생했습니다")
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">데이터 로딩 중...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <nav className="flex text-sm text-gray-500">
          <span>홈</span>
          <span className="mx-2">&gt;</span>
          <span>WIE 경비실 시스템</span>
          <span className="mx-2">&gt;</span>
          <span className="text-gray-900">대시보드</span>
        </nav>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">현재 현장 인원</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{currentPersonnelCount}</div>
            <p className="text-sm text-gray-600">명</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">금일 퇴근 인원</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{todayDepartedCount}</div>
            <p className="text-sm text-gray-600">명</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">주간 총 출입</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{weeklyStats.totalEntry}</div>
            <p className="text-xs text-gray-500">명</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold">출입현황관리</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label htmlFor="date-filter" className="text-sm font-medium text-gray-700">
                  날짜:
                </label>
                <input
                  id="date-filter"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <Select
                value={selectedPlan}
                onValueChange={(value) => {
                  setSelectedPlan(value)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="공사계획 선택" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SelectItem value="all">전체 공사계획</SelectItem>
                  {constructionPlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id.toString()}>
                      {plan.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {paginatedRecords.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>승인된 출입신청이 없습니다.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 text-sm font-medium text-gray-600">일자</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">출근시간</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">퇴근시간</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">출입신청자</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">공사계획</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">연락처</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">상태</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">수동처리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRecords.map((record) => (
                      <tr key={record.id} className="border-b">
                        <td className="p-3 text-sm">{record.date}</td>
                        <td className="p-3 text-sm">{record.entryTime}</td>
                        <td className="p-3 text-sm">{record.exitTime}</td>
                        <td className="p-3 text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <span>{record.applicant}</span>
                            <div className="flex flex-col gap-1">
                              {getRoleIndicators(record.application).map((role, index) => (
                                <div key={index} className="flex flex-col gap-0.5">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      role === "현장대리인"
                                        ? "bg-orange-100 text-orange-800"
                                        : "bg-purple-100 text-purple-800"
                                    }`}
                                  >
                                    {role}
                                  </span>
                                  {role === "차량소유자" && getVehicleNumber(record.application) && (
                                    <span className="text-xs text-gray-600 px-2">
                                      {getVehicleNumber(record.application)}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-sm">{record.details}</td>
                        <td className="p-3 text-sm">{record.contact}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              record.status === "출입완료"
                                ? "bg-green-100 text-green-800"
                                : record.status === "퇴근완료"
                                  ? "bg-gray-100 text-gray-800"
                                  : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {record.status}
                          </span>
                        </td>
                        <td className="p-3">
                          {record.status === "출입완료" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleManualExit(record.id, record.applicant)}
                              className="flex items-center gap-1 text-xs"
                            >
                              <LogOut className="w-3 h-3" />
                              퇴근처리
                            </Button>
                          )}
                          {record.status === "퇴근완료" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleManualReentry(record.id, record.applicant)}
                              className="flex items-center gap-1 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                            >
                              <LogIn className="w-3 h-3" />
                              재출근처리
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    총 {filteredRecords.length}명 중 {startIndex + 1}-
                    {Math.min(startIndex + recordsPerPage, filteredRecords.length)}명 표시
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      이전
                    </Button>
                    <span className="text-sm text-gray-600">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      다음
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">일자별 출입 현황</CardTitle>
          <p className="text-sm text-gray-600">최근 7일간 출입 통계</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-6">
            {chartData.map((day, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-gray-600 mb-2">{day.date}</div>
                  <div className="space-y-2">
                    <div className="flex flex-col items-center">
                      <div className="text-lg font-bold text-purple-600">{day.출근}</div>
                      <div className="text-xs text-gray-500">출근</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="text-lg font-bold text-orange-600">{day.퇴근}</div>
                      <div className="text-xs text-gray-500">퇴근</div>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t">
                    <div className="text-sm font-semibold text-gray-800">{day.총출입}</div>
                    <div className="text-xs text-gray-500">총 출입</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{chartData.reduce((s, d) => s + d.출근, 0)}</div>
              <div className="text-sm text-gray-600">주간 총 출근</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{chartData.reduce((s, d) => s + d.퇴근, 0)}</div>
              <div className="text-sm text-gray-600">주간 총 퇴근</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(chartData.reduce((s, d) => s + d.출근, 0) / 7)}
              </div>
              <div className="text-sm text-gray-500">일평균 출입</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {chartData.reduce((m, d) => (d.출근 > m.출근 ? d : m), chartData[0]).date}
              </div>
              <div className="text-sm text-gray-500">최다 출입일</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
