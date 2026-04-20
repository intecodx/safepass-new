"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, ChevronLeft, ChevronRight, LogOut, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
    work_company?: string
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

export default function SecurityDashboard() {
  const [currentPersonnel, setCurrentPersonnel] = useState(0)
  const [todayDeparted, setTodayDeparted] = useState(0)
  const [entryRecords, setEntryRecords] = useState<EntryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedPlan, setSelectedPlan] = useState<string>("all")
  const [constructionPlans, setConstructionPlans] = useState<{ id: number; title: string }[]>([])
  // 업무일 기준: 새벽 5시(KST)에 날짜 변경 (KST-5h = UTC+4h)
  const getBusinessDate = () => {
    const now = new Date()
    const businessTime = new Date(now.getTime() + 4 * 60 * 60 * 1000)
    return businessTime.toISOString().split("T")[0]
  }
  const [selectedDate, setSelectedDate] = useState<string>(getBusinessDate())
  const [weeklyChartData, setWeeklyChartData] = useState<Record<string, { entry: number; exit: number }>>({})
  const recordsPerPage = 10

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "inteco_scan_update") {
        console.log("[v0] QR 스캔 감지 (storage event) - 대시보드 새로고침")
        loadDashboardData()
      }
    }

    // Listen for storage changes from other tabs/windows
    window.addEventListener("storage", handleStorageChange)

    // Poll localStorage every 30 seconds to catch same-window updates (트래픽 절감)
    const pollInterval = setInterval(() => {
      const lastScan = localStorage.getItem("inteco_scan_update")
      if (lastScan) {
        const scanTime = Number.parseInt(lastScan)
        const now = Date.now()
        if (now - scanTime < 31000) {
          console.log("[v0] 최근 QR 스캔 감지 - 대시보드 새로고침")
          loadDashboardData()
          localStorage.removeItem("inteco_scan_update")
        }
      }
    }, 30000)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(pollInterval)
    }
  }, [])

  useEffect(() => {
    loadDashboardData()
    const interval = setInterval(loadDashboardData, 300000) // 5분 (기존 60초→추가 트래픽 절감)
    return () => clearInterval(interval)
  }, [selectedDate])

  useEffect(() => {
    const updateDate = () => {
      const today = getBusinessDate()
      setSelectedDate(today)
    }
    const interval = setInterval(updateDate, 60000) // 1분마다 업무일 체크
    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    try {
      const todayUTC = new Date()
      const todayKST = ymdKST(todayUTC)
      console.log("[v0] ===== 대시보드 데이터 로딩 =====")
      console.log("[v0] 현재 UTC 시간:", todayUTC.toISOString())
      console.log("[v0] 한국 시간 날짜:", todayKST)
      console.log("[v0] 선택된 날짜 필터:", selectedDate)
      console.log("[v0] =====================================")

      const response = await fetch(`/api/admin/applications?date=${selectedDate}`)
      const applications: Application[] = await response.json()
      const approvedApplications = applications.filter((app) => app.status === "approved")

      let accessLogs: any[] = []
      try {
        const accessResponse = await fetch(`/api/security/access-logs?date=${selectedDate}`)
        if (accessResponse.ok) {
          accessLogs = await accessResponse.json()
          console.log("[v0] 총 출입 로그:", accessLogs.length)
          console.log(
            "[v0] 최근 5개 로그:",
            accessLogs.slice(0, 5).map((log) => ({
              user_id: log.user_id,
              entry_time: log.entry_time,
              exit_time: log.exit_time,
              created_at: log.created_at,
            })),
          )
        }
      } catch (error) {
        console.log("[v0] 출입 로그 로딩 실패:", error)
      }

      // 주간 차트 데이터 로드
      try {
        const weeklyResponse = await fetch("/api/security/weekly-stats")
        if (weeklyResponse.ok) {
          const weeklyData = await weeklyResponse.json()
          setWeeklyChartData(weeklyData)
        }
      } catch (error) {
        console.log("[v0] 주간 통계 로딩 실패:", error)
      }

      accessLogs.sort((a, b) => {
        const timeA = new Date(a.created_at || 0).getTime()
        const timeB = new Date(b.created_at || 0).getTime()
        return timeB - timeA
      })

      const now = new Date()
      const koreaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }))
      const today = koreaTime.toISOString().split("T")[0] // YYYY-MM-DD format

      const uniquePlans = Array.from(
        new Map(
          approvedApplications
            .filter((app) => app.construction_plan)
            // Only show construction plans that haven't expired
            .filter((app) => {
              const endDate = app.construction_plan!.end_date
              return endDate >= today
            })
            // Only include plans where users have entry/exit logs
            .filter((app) => {
              const userAccessLog = accessLogs.find((log) => log.user_id === app.id)
              return userAccessLog && (userAccessLog.entry_time !== null || userAccessLog.exit_time !== null)
            })
            .map((app) => [
              app.construction_plan!.id,
              { id: app.construction_plan!.id, title: app.construction_plan!.title },
            ]),
        ).values(),
      )
      setConstructionPlans(uniquePlans)

      const records: EntryRecord[] = approvedApplications.map((app) => {
        const userAccessLog = accessLogs.find((log) => log.user_id === app.id)
        const hasEntryLog = userAccessLog && userAccessLog.entry_time !== null
        const hasExitLog = userAccessLog && userAccessLog.exit_time !== null

        let displayTime = parseAsUTC(app.created_at)
        let actualScanTime: Date | null = null

        const entryTime =
          hasEntryLog && userAccessLog.entry_time ? formatKSTTime(parseAsUTC(userAccessLog.entry_time)) : "-"

        const exitTime =
          hasExitLog && userAccessLog.exit_time ? formatKSTTime(parseAsUTC(userAccessLog.exit_time)) : "-"

        if (hasExitLog && userAccessLog.exit_time) {
          displayTime = parseAsUTC(userAccessLog.exit_time)
          actualScanTime = displayTime
        } else if (hasEntryLog && userAccessLog.entry_time) {
          displayTime = parseAsUTC(userAccessLog.entry_time)
          actualScanTime = displayTime
        }

        const ts = (actualScanTime ?? displayTime).getTime()
        if (isNaN(ts)) {
          console.error("[v0] Invalid timestamp for user:", app.name)
          displayTime = new Date()
        }

        let status = "입장가능"
        if (hasEntryLog && hasExitLog) {
          status = "퇴근완료"
        } else if (hasEntryLog) {
          status = "출입완료"
        }

        const recordDate = ymdKST(ts)
        if (recordDate === todayKST && status !== "입장가능") {
          console.log("[v0] 오늘 출입 기록 발견:", {
            name: app.name,
            status,
            recordDate,
            entryTime,
            exitTime,
            hasEntryLog,
            hasExitLog,
          })
        }

        return {
          id: app.id,
          time: formatKSTTime(ts),
          date: formatKSTDateLabel(ts),
          applicant: app.name,
          details: app.construction_plan?.title || "공사계획 미지정",
          contact: app.phone,
          status,
          application: app,
          entryCompleted: hasEntryLog,
          ts,
          entryTime,
          exitTime,
        }
      })

      records.sort((a, b) => b.ts - a.ts)

      setEntryRecords(records)
    } catch (error) {
      console.error("[v0] 경비실 대시보드 데이터 로딩 실패:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredByDate = entryRecords.filter((record) => {
    const recordDate = ymdKST(record.ts)
    return recordDate === selectedDate && record.status !== "입장가능"
  })

  console.log("[v0] 필터링된 기록:", {
    selectedDate,
    totalRecords: entryRecords.length,
    filteredCount: filteredByDate.length,
    statusBreakdown: {
      출입완료: filteredByDate.filter((r) => r.status === "출입완료").length,
      퇴근완료: filteredByDate.filter((r) => r.status === "퇴근완료").length,
    },
  })

  const currentPersonnelCount = filteredByDate.filter((r) => r.status === "출입완료").length
  const todayDepartedCount = filteredByDate.filter((r) => r.status === "퇴근완료").length

  const filteredRecords = filteredByDate.filter((record) => {
    if (selectedPlan === "all") return true
    return record.application.construction_plan?.id.toString() === selectedPlan
  })

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
      const dayStats = weeklyChartData[targetKey] || { entry: 0, exit: 0 }

      chartData.push({
        date: dateLabel,
        출근: dayStats.entry,
        퇴근: dayStats.exit,
        총출입: dayStats.entry,
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
      const response = await fetch("/api/security/manual-exit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      const result = await response.json()

      if (result.success) {
        alert(result.message)
        // Reload dashboard data to reflect changes
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
      const response = await fetch("/api/security/manual-reentry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      const result = await response.json()

      if (result.success) {
        alert(result.message)
        // Reload dashboard data to reflect changes
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
          <span>경비실 시스템</span>
          <span className="mx-2">&gt;</span>
          <span className="text-gray-900">대시보드</span>
        </nav>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">현재 현장 인원</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
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
            <div className="text-2xl font-bold text-blue-600">{weeklyStats.totalEntry}</div>
            <p className="text-xs text-gray-500">명</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-center">
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
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <p>선택한 날짜에 출입 기록이 없습니다.</p>
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
                      <th className="text-left p-3 text-sm font-medium text-gray-600 min-w-[120px]">공사계획</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">소속업체</th>
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
                        <td className="p-3 text-sm break-words min-w-[120px] max-w-[200px]">{record.details}</td>
                        <td className="p-3 text-sm text-gray-600">
                          {record.application.construction_plan?.work_company || "-"}
                        </td>
                        <td className="p-3 text-sm">{record.contact}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              record.status === "출입완료"
                                ? "bg-green-100 text-green-800"
                                : record.status === "퇴근완료"
                                  ? "bg-gray-100 text-gray-800"
                                  : "bg-blue-100 text-blue-800"
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
                              className="flex items-center gap-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
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
          {(() => {
            const maxVal = Math.max(...chartData.map((d) => Math.max(d.출근, d.퇴근)), 1)
            const barHeight = 220
            const gridLines = Array.from({ length: 5 }, (_, i) => Math.round((maxVal / 4) * (4 - i)))
            const weekTotal = chartData.reduce((s, d) => s + d.출근, 0)
            const weekExit = chartData.reduce((s, d) => s + d.퇴근, 0)
            const todayData = chartData[chartData.length - 1]
            return (
              <div className="mb-6">
                {/* Chart area */}
                <div className="relative" style={{ height: `${barHeight + 40}px` }}>
                  {/* Y-axis grid lines */}
                  {gridLines.map((val, i) => (
                    <div
                      key={i}
                      className="absolute left-0 right-0 flex items-center"
                      style={{ top: `${(i / 4) * barHeight}px` }}
                    >
                      <span className="text-[10px] text-gray-400 w-6 text-right mr-2 shrink-0">{val}</span>
                      <div className="flex-1 border-t border-gray-100" />
                    </div>
                  ))}
                  {/* Zero line */}
                  <div
                    className="absolute left-0 right-0 flex items-center"
                    style={{ top: `${barHeight}px` }}
                  >
                    <span className="text-[10px] text-gray-400 w-6 text-right mr-2 shrink-0">0</span>
                    <div className="flex-1 border-t border-gray-200" />
                  </div>

                  {/* Bars */}
                  <div className="absolute left-8 right-0 bottom-0 flex items-end justify-around" style={{ height: `${barHeight + 40}px` }}>
                    {chartData.map((day, index) => {
                      const isToday = index === chartData.length - 1
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center justify-end group cursor-default" style={{ height: `${barHeight + 40}px` }}>
                          {/* Tooltip on hover */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-800 text-white text-[10px] rounded-lg px-2.5 py-1.5 mb-1 whitespace-nowrap shadow-lg pointer-events-none">
                            <div className="font-semibold mb-0.5">{day.date}</div>
                            <div>출근 <span className="text-blue-300 font-bold">{day.출근}</span> / 퇴근 <span className="text-orange-300 font-bold">{day.퇴근}</span></div>
                          </div>
                          <div className="flex items-end gap-1 sm:gap-1.5 w-full justify-center px-1" style={{ height: `${barHeight}px` }}>
                            {/* Entry bar */}
                            <div className="flex flex-col items-center justify-end h-full flex-1 max-w-[32px]">
                              {day.출근 > 0 && (
                                <span className="text-[10px] sm:text-xs font-bold text-blue-600 mb-1">{day.출근}</span>
                              )}
                              <div
                                className="w-full rounded-t-md transition-all duration-700 ease-out group-hover:brightness-110"
                                style={{
                                  height: `${(day.출근 / maxVal) * (barHeight - 20)}px`,
                                  minHeight: day.출근 > 0 ? "6px" : "0",
                                  background: "linear-gradient(to top, #2563eb, #60a5fa)",
                                  boxShadow: day.출근 > 0 ? "0 -2px 8px rgba(37,99,235,0.2)" : "none",
                                }}
                              />
                            </div>
                            {/* Exit bar */}
                            <div className="flex flex-col items-center justify-end h-full flex-1 max-w-[32px]">
                              {day.퇴근 > 0 && (
                                <span className="text-[10px] sm:text-xs font-bold text-orange-500 mb-1">{day.퇴근}</span>
                              )}
                              <div
                                className="w-full rounded-t-md transition-all duration-700 ease-out group-hover:brightness-110"
                                style={{
                                  height: `${(day.퇴근 / maxVal) * (barHeight - 20)}px`,
                                  minHeight: day.퇴근 > 0 ? "6px" : "0",
                                  background: "linear-gradient(to top, #ea580c, #fb923c)",
                                  boxShadow: day.퇴근 > 0 ? "0 -2px 8px rgba(234,88,12,0.2)" : "none",
                                }}
                              />
                            </div>
                          </div>
                          {/* Date label */}
                          <div className={`text-xs mt-2 font-medium ${isToday ? "text-blue-600 font-bold" : "text-gray-500"}`}>
                            {day.date}
                            {isToday && <div className="text-[9px] text-blue-400 font-normal">오늘</div>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-sm" style={{ background: "linear-gradient(to top, #2563eb, #60a5fa)" }} />
                    <span className="text-xs font-medium text-gray-600">출근</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-sm" style={{ background: "linear-gradient(to top, #ea580c, #fb923c)" }} />
                    <span className="text-xs font-medium text-gray-600">퇴근</span>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
              <div className="text-3xl font-extrabold text-blue-600">{chartData.reduce((s, d) => s + d.출근, 0)}</div>
              <div className="text-xs font-medium text-blue-500 mt-1">주간 총 출근</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 text-center">
              <div className="text-3xl font-extrabold text-orange-600">{chartData.reduce((s, d) => s + d.퇴근, 0)}</div>
              <div className="text-xs font-medium text-orange-500 mt-1">주간 총 퇴근</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-4 text-center">
              <div className="text-3xl font-extrabold text-emerald-600">
                {Math.round(chartData.reduce((s, d) => s + d.출근, 0) / 7)}
              </div>
              <div className="text-xs font-medium text-emerald-500 mt-1">일평균 출입</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl p-4 text-center">
              <div className="text-3xl font-extrabold text-violet-600">
                {chartData.reduce((m, d) => (d.출근 > m.출근 ? d : m), chartData[0]).date}
              </div>
              <div className="text-xs font-medium text-violet-500 mt-1">최다 출입일</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
