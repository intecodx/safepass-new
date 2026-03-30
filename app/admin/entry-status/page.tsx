"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, UserCheck, UserX, RefreshCw, Calendar } from "lucide-react"

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

function getKSTDateString(date: Date | string): string {
  const d = typeof date === "string" ? parseAsUTC(date) : date
  if (isNaN(d.getTime())) return ""

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: KST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(d)
    .split(". ")
    .join("-")
    .replace(".", "")
}

interface EntryStatusData {
  id: number
  name: string
  phone: string
  construction_plan_title: string
  construction_plan_status: string
  work_company: string
  status: string
  entry_time: string | null
  exit_time: string | null
  blood_type: string
  roles?: any
  vehicle_info?: any
}

interface StatusStats {
  total: number
  entered: number
  exited: number
  not_entered: number
}

export default function EntryStatusPage() {
  const [entryData, setEntryData] = useState<EntryStatusData[]>([])
  const [filteredData, setFilteredData] = useState<EntryStatusData[]>([])
  const [stats, setStats] = useState<StatusStats>({ total: 0, entered: 0, exited: 0, not_entered: 0 })
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [selectedConstructionPlan, setSelectedConstructionPlan] = useState<string>("all")
  const [constructionPlans, setConstructionPlans] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  const fetchEntryStatus = async () => {
    if (!isInitialLoad) {
      setIsLoading(false)
    }
    try {
      const params = new URLSearchParams({
        date: selectedDate,
        ...(selectedConstructionPlan !== "all" && { construction_plan: selectedConstructionPlan }),
      })
      const response = await fetch(`/api/admin/entry-status?${params}`)
      if (response.ok) {
        const data = await response.json()
        setEntryData(data.entries)
        setStats(data.stats)
        setFilteredData(data.entries)
        setConstructionPlans(data.constructionPlans || [])
      }
    } catch (error) {
      console.error("Failed to fetch entry status:", error)
    } finally {
      if (isInitialLoad) {
        setIsLoading(false)
        setIsInitialLoad(false)
      }
    }
  }

  useEffect(() => {
    fetchEntryStatus()
    const interval = setInterval(fetchEntryStatus, 300000) // 5분 (기존 60초→추가 트래픽 절감)
    return () => clearInterval(interval)
  }, [selectedDate, selectedConstructionPlan])

  useEffect(() => {
    const todayDateString = selectedDate

    const filtered = entryData.filter((entry) => {
      // Only show people who have entered (have entry_time)
      if (!entry.entry_time) return false

      // Check if entry_time or exit_time is from today
      const entryDateString = entry.entry_time ? getKSTDateString(entry.entry_time) : ""
      const exitDateString = entry.exit_time ? getKSTDateString(entry.exit_time) : ""

      const isFromToday = entryDateString === todayDateString || exitDateString === todayDateString

      if (!isFromToday) return false

      // Apply search filter
      return (
        entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.phone.includes(searchTerm) ||
        entry.construction_plan_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.work_company.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })

    setFilteredData(filtered)
  }, [searchTerm, entryData, selectedDate])

  const formatTime = (timeString: string | null) => {
    if (!timeString) return "-"

    try {
      const parsedDate = parseAsUTC(timeString)
      if (isNaN(parsedDate.getTime())) {
        return "-"
      }

      return formatKSTTime(parsedDate)
    } catch (error) {
      console.error("[v0] formatTime error:", error, "timeString:", timeString)
      return "-"
    }
  }

  const getStatusBadge = (status: string, entryTime: string | null, exitTime: string | null) => {
    if (exitTime) {
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-700">
          퇴근완료
        </Badge>
      )
    }
    if (entryTime) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-700">
          출근완료
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700">
        미출근
      </Badge>
    )
  }

  const getConstructionStatusBadge = (status: string) => {
    switch (status) {
      case "planned":
        return <Badge variant="secondary">계획</Badge>
      case "ongoing":
        return (
          <Badge variant="default" className="bg-blue-500">
            진행중
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="default" className="bg-green-500">
            완료
          </Badge>
        )
      case "same_day":
        return (
          <Badge variant="default" className="bg-orange-500">
            당일 공사
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getRoleIndicators = (entry: EntryStatusData) => {
    const indicators = []

    // Check if user is site representative (현장대리인)
    if (entry.roles) {
      try {
        const rolesData = typeof entry.roles === "string" ? JSON.parse(entry.roles) : entry.roles
        if (rolesData.site_manager === true) {
          indicators.push("현장대리인")
        }
      } catch (error) {
        // If roles is not JSON, check if it's an array or object
        if (Array.isArray(entry.roles)) {
          if (entry.roles.includes("site_representative") || entry.roles.includes("현장대리인")) {
            indicators.push("현장대리인")
          }
        } else if (typeof entry.roles === "object" && entry.roles.site_manager) {
          indicators.push("현장대리인")
        }
      }
    }

    // Check if user is vehicle owner (차량소유자)
    if (entry.vehicle_info) {
      try {
        const vehicleInfo = typeof entry.vehicle_info === "string" ? JSON.parse(entry.vehicle_info) : entry.vehicle_info

        // If vehicle info exists, assume they are the owner
        if (vehicleInfo && (vehicleInfo.number || vehicleInfo.type)) {
          indicators.push("차량소유자")
        }
      } catch (error) {
        // If vehicle_info exists but can't be parsed, assume they are the owner
        indicators.push("차량소유자")
      }
    }

    if (entry.roles) {
      try {
        const rolesData = typeof entry.roles === "string" ? JSON.parse(entry.roles) : entry.roles
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

  const getVehicleNumber = (entry: EntryStatusData) => {
    if (!entry.vehicle_info) return null

    try {
      const vehicleInfo = typeof entry.vehicle_info === "string" ? JSON.parse(entry.vehicle_info) : entry.vehicle_info

      return vehicleInfo?.number || null
    } catch (error) {
      return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">출입현황</h1>
          <p className="text-gray-600">날짜별 작업자 출입 현황을 확인하세요</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-600" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto bg-white"
          />
          <Button onClick={fetchEntryStatus} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">출근중</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.entered}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">퇴근완료</CardTitle>
            <UserX className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.exited}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            {/* Construction Plan Filter */}
            <div className="flex flex-col gap-2 w-full sm:w-64">
              <span className="text-sm font-medium text-gray-700">공사명 필터</span>
              <Select value={selectedConstructionPlan} onValueChange={setSelectedConstructionPlan}>
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="공사 선택" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">전체</SelectItem>
                  {constructionPlans.map((plan) => (
                    <SelectItem key={plan} value={plan}>
                      {plan}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search Input */}
            <div className="flex flex-col gap-2 flex-1 w-full">
              <span className="text-sm font-medium text-gray-700">검색</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="이름, 전화번호, 공사명, 회사명으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white"
                />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Entry Status Table */}
      <Card>
        <CardHeader>
          <CardTitle>출입 현황 ({filteredData.length}명)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-3 font-semibold text-gray-900">날짜</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-900">이름</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-900">전화번호</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-900">혈액형</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-900">출근시간</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-900">퇴근시간</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-900">상태</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-900">공사명</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((entry) => {
                    const displayDate = entry.exit_time || entry.entry_time || selectedDate

                    return (
                      <tr key={entry.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-3 text-gray-700 bg-white">{formatKSTDateLabel(displayDate)}</td>
                        <td className="py-4 px-3 font-medium text-gray-900 bg-white">
                          <div className="flex items-center gap-2">
                            <span>{entry.name}</span>
                            <div className="flex flex-col gap-1">
                              {getRoleIndicators(entry).map((role, index) => (
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
                                  {role === "차량소유자" && getVehicleNumber(entry) && (
                                    <span className="text-xs text-gray-600 px-2">{getVehicleNumber(entry)}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-3 text-gray-700 bg-white">{entry.phone}</td>
                        <td className="py-4 px-3 text-gray-700 bg-white">{entry.blood_type || "-"}</td>
                        <td className="py-4 px-3 text-gray-700 font-mono bg-white">{formatTime(entry.entry_time)}</td>
                        <td className="py-4 px-3 text-gray-700 font-mono bg-white">{formatTime(entry.exit_time)}</td>
                        <td className="py-4 px-3 bg-white">
                          {getStatusBadge(entry.status, entry.entry_time, entry.exit_time)}
                        </td>
                        <td className="py-4 px-3 text-gray-700 bg-white">{entry.construction_plan_title}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {filteredData.length === 0 && <div className="text-center py-8 text-gray-500">검색 결과가 없습니다.</div>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
