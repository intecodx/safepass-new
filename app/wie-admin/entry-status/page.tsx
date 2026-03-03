"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, UserCheck, UserX, RefreshCw } from "lucide-react"

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
  roles?: any // Updated roles field to any type
  vehicle_info?: any // Updated vehicle_info field to any type
}

interface StatusStats {
  total: number
  entered: number
  exited: number
  not_entered: number
}

export default function WieEntryStatusPage() {
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
    if (isInitialLoad) {
      setIsLoading(true)
    }
    try {
      const params = new URLSearchParams({
        date: selectedDate,
        ...(selectedConstructionPlan !== "all" && { construction_plan: selectedConstructionPlan }),
      })
      const response = await fetch(`/api/wie-admin/entry-status?${params}`)
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
        setIsInitialLoad(false)
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    setIsInitialLoad(true)
    fetchEntryStatus()
    const interval = setInterval(fetchEntryStatus, 5000) // Reduced refresh interval from 30 seconds to 5 seconds for near real-time updates
    return () => clearInterval(interval)
  }, [selectedDate, selectedConstructionPlan])

  useEffect(() => {
    const filtered = entryData.filter(
      (entry) =>
        // Only show people who have entered (have entry_time)
        entry.entry_time &&
        (entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.phone.includes(searchTerm) ||
          entry.construction_plan_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.work_company.toLowerCase().includes(searchTerm.toLowerCase())),
    )
    setFilteredData(filtered)
  }, [searchTerm, entryData])

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

  const getRoleIndicators = (roles?: any, vehicleInfo?: any) => {
    const indicators = []

    // Safely convert roles to array if it's not already
    let rolesArray: string[] = []
    if (Array.isArray(roles)) {
      rolesArray = roles
    } else if (roles && typeof roles === "object") {
      // If roles is an object, check for site_manager property
      if (roles.site_manager === true) {
        rolesArray.push("site_representative")
      }
    } else if (typeof roles === "string") {
      // If roles is a string, try to parse it
      try {
        const parsed = JSON.parse(roles)
        if (Array.isArray(parsed)) {
          rolesArray = parsed
        } else if (parsed && parsed.site_manager === true) {
          rolesArray.push("site_representative")
        }
      } catch {
        rolesArray = []
      }
    }

    if (rolesArray.includes("site_representative")) {
      indicators.push("현장대리인")
    }

    // Check if user is vehicle owner
    if (vehicleInfo) {
      indicators.push("차량소유자")
    }

    return indicators
  }

  const getVehicleNumber = (vehicleInfo?: any) => {
    if (!vehicleInfo) return null

    // If vehicle_info is already an object with number property
    if (typeof vehicleInfo === "object" && vehicleInfo.number) {
      return vehicleInfo.number
    }

    // If vehicle_info is already an object with vehicle_number property
    if (typeof vehicleInfo === "object" && vehicleInfo.vehicle_number) {
      return vehicleInfo.vehicle_number
    }

    // If vehicle_info is a string, try to parse it
    if (typeof vehicleInfo === "string") {
      try {
        const parsed = JSON.parse(vehicleInfo)
        return parsed.number || parsed.vehicle_number || null
      } catch {
        return null
      }
    }

    return null
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">출입현황</h1>
          <p className="text-sm sm:text-base text-gray-600">실시간 작업자 출입 현황을 확인하세요</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full sm:w-auto"
          />
          <Button onClick={fetchEntryStatus} variant="outline" size="sm" className="w-full sm:w-auto bg-transparent">
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Construction Plan Filter */}
            <div className="flex flex-col gap-2 flex-1">
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
            <div className="flex flex-col gap-2 flex-1">
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
          <CardTitle className="text-base sm:text-lg">출입 현황 ({filteredData.length}명)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && isInitialLoad ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-900 whitespace-nowrap">
                        날짜
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-900 whitespace-nowrap">
                        이름
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-900 whitespace-nowrap">
                        전화번호
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-900 whitespace-nowrap">
                        혈액형
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-900 whitespace-nowrap">
                        출근시간
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-900 whitespace-nowrap">
                        퇴근시간
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-900 whitespace-nowrap">
                        상태
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-900 whitespace-nowrap">
                        공사명
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.map((entry) => {
                      const roleIndicators = getRoleIndicators(entry.roles, entry.vehicle_info)
                      const vehicleNumber = getVehicleNumber(entry.vehicle_info)

                      return (
                        <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-4 text-sm text-gray-700 whitespace-nowrap">
                            {formatKSTDateLabel(entry.entry_time || selectedDate)}
                          </td>
                          <td className="px-3 py-4 text-sm font-medium text-gray-900">
                            <div className="flex items-center gap-2">
                              <span>{entry.name}</span>
                              <div className="flex flex-col gap-1">
                                {roleIndicators.map((role, index) => (
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
                                    {role === "차량소유자" && vehicleNumber && (
                                      <span className="text-xs text-gray-600 px-2">{vehicleNumber}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-700 whitespace-nowrap">{entry.phone}</td>
                          <td className="px-3 py-4 text-sm text-gray-700 whitespace-nowrap">
                            {entry.blood_type || "-"}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-700 font-mono whitespace-nowrap">
                            {formatTime(entry.entry_time)}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-700 font-mono whitespace-nowrap">
                            {formatTime(entry.exit_time)}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            {getStatusBadge(entry.status, entry.entry_time, entry.exit_time)}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-700 whitespace-nowrap">
                            {entry.construction_plan_title}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {filteredData.length === 0 && <div className="text-center py-8 text-gray-500">검색 결과가 없습니다.</div>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
