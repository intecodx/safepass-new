"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  ArrowLeft,
  Check,
  X,
  QrCode,
  User,
  Car,
  RefreshCw,
  Trash2,
  LogIn,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Application {
  id: number
  name: string
  phone: string
  nationality: string
  passport_number: string
  birth_date: string
  gender: string
  status: string
  construction_plan?: {
    id: number
    title: string
    company: string
  }
  roles: {
    site_manager: boolean
    vehicle_owner: boolean
  }
  vehicle_info?: {
    number: string
    type: string
  }
  created_at: string
  work_status?: {
    entry_completed: boolean
    exit_completed: boolean
    today_logs_count: number
    entry_time?: string
    exit_time?: string
  }
}

interface GroupedApplications {
  plan: {
    id: number
    title: string
    company: string
  }
  applications: Application[]
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedApplications, setSelectedApplications] = useState<number[]>([])
  const [selectedByPlan, setSelectedByPlan] = useState<Record<string, number[]>>({})
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>("all")
  const [plans, setPlans] = useState<{ id: number; title: string; company: string }[]>([])
  const [currentPersonnel, setCurrentPersonnel] = useState(0)
  const [todayDeparted, setTodayDeparted] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  const topScrollRef = useRef<HTMLDivElement>(null)
  const tableScrollRef = useRef<HTMLDivElement>(null)
  const isSyncingScroll = useRef(false)
  const [tableContentWidth, setTableContentWidth] = useState(0)

  const handleTopScroll = useCallback(() => {
    if (isSyncingScroll.current) return
    isSyncingScroll.current = true
    if (tableScrollRef.current && topScrollRef.current) {
      tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft
    }
    isSyncingScroll.current = false
  }, [])

  const handleTableScroll = useCallback(() => {
    if (isSyncingScroll.current) return
    isSyncingScroll.current = true
    if (topScrollRef.current && tableScrollRef.current) {
      topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft
    }
    isSyncingScroll.current = false
  }, [])

  useEffect(() => {
    const tableEl = tableScrollRef.current
    if (!tableEl) return
    const updateWidth = () => {
      const table = tableEl.querySelector("table")
      if (table) setTableContentWidth(table.scrollWidth)
    }
    updateWidth()
    const observer = new ResizeObserver(updateWidth)
    observer.observe(tableEl)
    return () => observer.disconnect()
  }, [applications, selectedPlanFilter, currentPage])

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/admin/construction-plans", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      })
      if (response.ok) {
        const data = await response.json()
        const normalized = (Array.isArray(data) ? data : []).map((p: any) => ({
          id: p.id,
          title: p.title,
          company: p.company,
        }))
        setPlans(normalized)
      } else {
        setPlans([])
      }
    } catch (e) {
      setPlans([])
    }
  }

  const fetchApplications = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      console.log("신청 목록 조회 시작...")
      const response = await fetch("/api/admin/applications", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      console.log("응답 상태:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("받은 데이터:", data)
        setApplications(data)

        const approvedApps = data.filter((app: Application) => app.status === "approved")
        const currentlyWorking = approvedApps.filter(
          (app: Application) => app.work_status?.entry_completed && !app.work_status?.exit_completed,
        ).length
        const todayExited = approvedApps.filter((app: Application) => app.work_status?.exit_completed).length

        setCurrentPersonnel(currentlyWorking)
        setTodayDeparted(todayExited)
      } else {
        console.error("응답 오류:", response.status)
        setApplications([])
      }
    } catch (error) {
      console.error("신청 목록 조회 실패:", error)
      setApplications([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const groupApplicationsByPlan = (applications: Application[]): GroupedApplications[] => {
    const grouped = applications.reduce(
      (acc, app) => {
        const planKey = app.construction_plan ? `${app.construction_plan.id}` : "no-plan"
        if (!acc[planKey]) {
          acc[planKey] = {
            plan: app.construction_plan || { id: 0, title: "공사계획 미지정", company: "-" },
            applications: [],
          }
        }
        acc[planKey].applications.push(app)
        return acc
      },
      {} as Record<string, GroupedApplications>,
    )

    return Object.values(grouped)
  }

  const handleRefresh = () => {
    fetchApplications(true)
    fetchPlans()
    setSelectedApplications([])
    setSelectedByPlan({})
    setSelectedPlanFilter("all")
  }

  const handleSelectAllByPlan = (planId: string, applications: Application[], checked: boolean) => {
    const pendingIds = applications.filter((app) => app.status === "pending").map((app) => app.id)

    setSelectedByPlan((prev) => ({
      ...prev,
      [planId]: checked ? pendingIds : [],
    }))

    if (checked) {
      setSelectedApplications((prev) => [...new Set([...prev, ...pendingIds])])
    } else {
      setSelectedApplications((prev) => prev.filter((id) => !pendingIds.includes(id)))
    }
  }

  const handleSelectApplicationByPlan = (planId: string, appId: number, checked: boolean) => {
    setSelectedByPlan((prev) => ({
      ...prev,
      [planId]: checked ? [...(prev[planId] || []), appId] : (prev[planId] || []).filter((id) => id !== appId),
    }))

    if (checked) {
      setSelectedApplications((prev) => [...prev, appId])
    } else {
      setSelectedApplications((prev) => prev.filter((id) => id !== appId))
    }
  }

  const handleBulkApproveByPlan = async (selectedIds: number[]) => {
    if (selectedIds.length === 0) return

    if (
      !confirm(
        `선택한 ${selectedIds.length}개의 신청을 승인하시겠습니까?\n(승인 시 각 신청자에게 QR코드가 포함된 문자가 발송됩니다.)`,
      )
    ) {
      return
    }

    try {
      const promises = selectedIds.map(async (id) => {
        const app = applications.find((a) => a.id === id)
        if (app) {
          const response = await fetch(`/api/admin/applications/${id}/approve`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: app.phone }),
          })

          if (response.ok) {
            const result = await response.json()
            return {
              success: true,
              name: app.name,
              phone: app.phone,
              smsSuccess: !result.warning,
              message: result.message,
            }
          }
          return { success: false, name: app.name, phone: app.phone }
        }
        return { success: false, name: "알 수 없음", phone: "알 수 없음" }
      })

      const results = await Promise.all(promises)
      const successCount = results.filter((r) => r.success).length
      const smsSuccessCount = results.filter((r) => r.success && r.smsSuccess).length
      const smsFailedResults = results.filter((r) => r.success && !r.smsSuccess)

      let message = `${successCount}개의 신청이 승인되었습니다.\n`
      message += `${smsSuccessCount}개의 QR코드 문자가 성공적으로 발송되었습니다.`

      if (smsFailedResults.length > 0) {
        message += `\n\n⚠️ 다음 ${smsFailedResults.length}개 문자 발송 실패:`
        smsFailedResults.forEach((result) => {
          message += `\n- ${result.name} (${result.phone})`
        })
        message += `\n\n※ 실패한 경우 QR코드 URL을 수동으로 전달해주세요.`
      }

      alert(message)
      setSelectedApplications([])
      setSelectedByPlan({})
      fetchApplications()
    } catch (error) {
      console.error("일괄 승인 실패:", error)
      alert("일괄 승인 중 오류가 발생했습니다.")
    }
  }

  const handleBulkRejectByPlan = async (selectedIds: number[]) => {
    if (selectedIds.length === 0) return

    if (!confirm(`선택한 ${selectedIds.length}개의 신청을 반려하시겠습니까?`)) {
      return
    }

    try {
      const promises = selectedIds.map(async (id) => {
        const response = await fetch(`/api/admin/applications/${id}/reject`, {
          method: "POST",
        })
        return response.ok
      })

      const results = await Promise.all(promises)
      const successCount = results.filter(Boolean).length

      alert(`${successCount}개의 신청이 반려되었습니다.`)
      setSelectedApplications([])
      setSelectedByPlan({})
      fetchApplications()
    } catch (error) {
      console.error("일괄 반려 실패:", error)
      alert("일괄 반려 중 오류가 발생했습니다.")
    }
  }

  const handleApprove = async (id: number, phone: string) => {
    try {
      const response = await fetch(`/api/admin/applications/${id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone }),
      })

      if (response.ok) {
        alert("승인이 완료되었습니다. QR코드가 문자로 발송됩니다.")
        fetchApplications()
      } else {
        alert("승인 처리 중 오류가 발생했습니다.")
      }
    } catch (error) {
      console.error("승인 실패:", error)
      alert("승인 처리 중 오류가 발생했습니다.")
    }
  }

  const handleReject = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/applications/${id}/reject`, {
        method: "POST",
      })

      if (response.ok) {
        alert("신청이 반려되었습니다.")
        fetchApplications()
      } else {
        alert("반려 처리 중 오류가 발생했습니다.")
      }
    } catch (error) {
      console.error("반려 실패:", error)
      alert("반려 처리 중 오류가 발생했습니다.")
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`정말로 "${name}"님의 신청을 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다.`)) {
      return
    }

    try {
      console.log(`[v0] 사용자 삭제 시작: ID ${id}, 이름: ${name}`)

      const response = await fetch(`/api/admin/applications/${id}/delete`, {
        method: "DELETE",
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`[v0] 사용자 삭제 성공:`, result)
        alert(`"${name}"님의 신청이 삭제되었습니다.`)
        fetchApplications()
      } else {
        const error = await response.json()
        console.error(`[v0] 사용자 삭제 실패:`, error)
        alert(`삭제 처리 중 오류가 발생했습니다: ${error.error || "알 수 없는 오류"}`)
      }
    } catch (error) {
      console.error(`[v0] 사용자 삭제 오류:`, error)
      alert("삭제 처리 중 오류가 발생했습니다.")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">승인대기</Badge>
      case "approved":
        return (
          <Badge variant="default" className="bg-blue-500">
            승인완료
          </Badge>
        )
      case "rejected":
        return <Badge variant="destructive">반려</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getRoleBadges = (roles: { site_manager: boolean; vehicle_owner: boolean }) => {
    const badges = []
    if (roles.site_manager) {
      badges.push(
        <Badge key="site-manager" variant="outline" className="bg-green-50 text-green-800 border-green-300">
          <User className="w-3 h-3 mr-1" />
          현장대리인
        </Badge>,
      )
    }
    if (roles.vehicle_owner) {
      badges.push(
        <Badge key="vehicle-owner" variant="outline" className="bg-blue-50 text-blue-800 border-blue-300">
          <Car className="w-3 h-3 mr-1" />
          차량소유자
        </Badge>,
      )
    }
    if (!roles.site_manager && !roles.vehicle_owner) {
      badges.push(
        <Badge key="general" variant="outline" className="bg-gray-50 text-gray-800 border-gray-300">
          일반 출입자
        </Badge>,
      )
    }
    return badges
  }

  const getFilteredGroups = (groups: GroupedApplications[]): GroupedApplications[] => {
    if (selectedPlanFilter === "all") {
      return groups
    }
    return groups.filter((group) => group.plan.id.toString() === selectedPlanFilter)
  }

  const getWorkStatusBadge = (workStatus?: {
    entry_completed: boolean
    exit_completed: boolean
    today_logs_count: number
    entry_time?: string
    exit_time?: string
  }) => {
    if (!workStatus) {
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-600">
          미출입
        </Badge>
      )
    }

    if (workStatus.exit_completed) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
          <LogOut className="w-3 h-3 mr-1" />
          퇴근완료
        </Badge>
      )
    } else if (workStatus.entry_completed) {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
          <LogIn className="w-3 h-3 mr-1" />
          출근완료
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-600">
          미출입
        </Badge>
      )
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-"

    try {
      let s = String(dateString).trim()

      // Handle timezone conversion exactly like security system
      if (/\+09:00$/.test(s)) {
        // Already KST
      } else if (/Z$/.test(s)) {
        s = s.replace(/Z$/, "+09:00")
      } else if (/(\+00:00|-00:00)$/.test(s)) {
        s = s.replace(/(\+00:00|-00:00)$/, "+09:00")
      } else if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?$/.test(s)) {
        s = s.replace(" ", "T") + "+09:00"
      } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?$/.test(s)) {
        s = s + "+09:00"
      }

      const date = new Date(s)
      if (isNaN(date.getTime())) return "-"

      // Format date in Korean format: YYYY.MM.DD
      return new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
        .format(date)
        .replace(/\./g, ".")
        .replace(/\s/g, "")
    } catch (error) {
      console.log("[v0] Error formatting date:", dateString, error)
      return "-"
    }
  }

  const handleBulkApprove = async () => {
    if (selectedApplications.length === 0) return

    if (
      !confirm(
        `선택한 ${selectedApplications.length}개의 신청을 승인하시겠습니까?\n(승인 시 각 신청자에게 QR코드가 포함된 문자가 발송됩니다.)`,
      )
    ) {
      return
    }

    try {
      const promises = selectedApplications.map(async (id) => {
        const app = applications.find((a) => a.id === id)
        if (app) {
          const response = await fetch(`/api/admin/applications/${id}/approve`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: app.phone }),
          })

          if (response.ok) {
            const result = await response.json()
            return {
              success: true,
              name: app.name,
              phone: app.phone,
              smsSuccess: !result.warning,
              message: result.message,
            }
          }
          return { success: false, name: app.name, phone: app.phone }
        }
        return { success: false, name: "알 수 없음", phone: "알 수 없음" }
      })

      const results = await Promise.all(promises)
      const successCount = results.filter((r) => r.success).length
      const smsSuccessCount = results.filter((r) => r.success && r.smsSuccess).length
      const smsFailedResults = results.filter((r) => r.success && !r.smsSuccess)

      let message = `${successCount}개의 신청이 승인되었습니다.\n`
      message += `${smsSuccessCount}개의 QR코드 문자가 성공적으로 발송되었습니다.`

      if (smsFailedResults.length > 0) {
        message += `\n\n⚠️ 다음 ${smsFailedResults.length}개 문자 발송 실패:`
        smsFailedResults.forEach((result) => {
          message += `\n- ${result.name} (${result.phone})`
        })
        message += `\n\n※ 실패한 경우 QR코드 URL을 수동으로 전달해주세요.`
      }

      alert(message)
      setSelectedApplications([])
      fetchApplications()
    } catch (error) {
      console.error("일괄 승인 실패:", error)
      alert("일괄 승인 중 오류가 발생했습니다.")
    }
  }

  const handleBulkReject = async () => {
    if (selectedApplications.length === 0) return

    if (!confirm(`선택한 ${selectedApplications.length}개의 신청을 반려하시겠습니까?`)) {
      return
    }

    try {
      const promises = selectedApplications.map(async (id) => {
        const response = await fetch(`/api/admin/applications/${id}/reject`, {
          method: "POST",
        })
        return response.ok
      })

      const results = await Promise.all(promises)
      const successCount = results.filter(Boolean).length

      alert(`${successCount}개의 신청이 반려되었습니다.`)
      setSelectedApplications([])
      fetchApplications()
    } catch (error) {
      console.error("일괄 반려 실패:", error)
      alert("일괄 반려 중 오류가 발생했습니다.")
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const selectableIds = applications.filter((app) => app.status === "pending").map((app) => app.id)
      setSelectedApplications(selectableIds)
    } else {
      setSelectedApplications([])
    }
  }

  const handleSelectApplication = (appId: number, checked: boolean) => {
    if (checked) {
      setSelectedApplications((prev) => [...prev, appId])
    } else {
      setSelectedApplications((prev) => prev.filter((id) => id !== appId))
    }
  }

  useEffect(() => {
    fetchPlans()
    fetchApplications()
    const interval = setInterval(() => {
      fetchApplications(true)
    }, 30000) // 30초마다 자동 새로고침
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setCurrentPage(1)
    setSelectedApplications([])
  }, [selectedPlanFilter])

  const groupedApplications = groupApplicationsByPlan(applications)
  const filteredGroups = getFilteredGroups(groupedApplications)
  const constructionPlans = plans

  const flatApplications = filteredGroups.flatMap((group) =>
    group.applications.map((app) => ({
      ...app,
      construction_plan_title: group.plan.title,
      construction_plan_company: group.plan.company,
    })),
  )

  const sortedApplications = flatApplications.sort((a, b) => {
    const dateA = new Date(a.created_at)
    const dateB = new Date(b.created_at)
    return dateB.getTime() - dateA.getTime() // Newest first
  })

  const totalPages = Math.ceil(sortedApplications.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedApplications = sortedApplications.slice(startIndex, endIndex)

  const pendingApplications = paginatedApplications.filter((app) => app.status === "pending")
  const isAllSelected =
    pendingApplications.length > 0 && pendingApplications.every((app) => selectedApplications.includes(app.id))
  const isIndeterminate = pendingApplications.some((app) => selectedApplications.includes(app.id)) && !isAllSelected

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "-"

    try {
      let s = String(dateString).trim()

      // Handle timezone conversion exactly like security system
      if (/\+09:00$/.test(s)) {
        // Already KST
      } else if (/Z$/.test(s)) {
        s = s.replace(/Z$/, "+09:00")
      } else if (/(\+00:00|-00:00)$/.test(s)) {
        s = s.replace(/(\+00:00|-00:00)$/, "+09:00")
      } else if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?$/.test(s)) {
        s = s.replace(" ", "T") + "+09:00"
      } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?$/.test(s)) {
        s = s + "+09:00"
      }

      const date = new Date(s)
      if (isNaN(date.getTime())) return "-"

      // Format date in Korean format: YYYY.MM.DD
      const dateStr = new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
        .format(date)
        .replace(/\./g, ".")
        .replace(/\s/g, "")

      // Format time: 오전/오후 HH:MM
      const timeStr = new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(date)

      return `${dateStr} ${timeStr}`
    } catch (error) {
      console.log("[v0] Error formatting datetime:", dateString, error)
      return "-"
    }
  }

  const getRelevantDate = (app: Application) => {
    return formatDate(app.created_at)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">신청 목록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
          <div className="flex items-center w-full sm:w-auto">
            <Link href="/admin/dashboard" className="mr-2 sm:mr-4">
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
            </Link>
            <img src="/images/logo.png" alt="인천종합에너지주식회사" className="h-6 sm:h-8 mr-2 sm:mr-4" />
            <h1 className="text-base sm:text-xl font-semibold text-gray-900">출입 신청 관리</h1>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={refreshing}
            className="flex items-center space-x-2 bg-transparent w-full sm:w-auto"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="text-xs sm:text-sm">{refreshing ? "새로고침 중..." : "새로고침"}</span>
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="mb-4 sm:mb-6 bg-white rounded-lg border p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <Label htmlFor="plan-filter" className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
              공사계획 선택:
            </Label>
            <Select value={selectedPlanFilter} onValueChange={setSelectedPlanFilter}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="공사계획을 선택하세요" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                <SelectItem value="all">전체 공사계획</SelectItem>
                {constructionPlans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id.toString()}>
                    {plan.title} ({plan.company})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPlanFilter !== "all" && (
              <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-300 text-xs">
                필터링 중: {constructionPlans.find((p) => p.id.toString() === selectedPlanFilter)?.title}
              </Badge>
            )}
          </div>
        </div>

        {sortedApplications.length > 0 ? (
          <div className="space-y-4">
            {selectedApplications.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                    <span className="text-xs sm:text-sm font-medium text-blue-800">
                      {selectedApplications.length}개 항목 선택됨
                    </span>
                    <div className="flex space-x-2 w-full sm:w-auto">
                      <Button
                        onClick={handleBulkApprove}
                        size="sm"
                        className="bg-blue-400 hover:bg-blue-500 flex-1 sm:flex-none text-xs"
                      >
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        일괄 승인
                      </Button>
                      <Button
                        onClick={handleBulkReject}
                        size="sm"
                        className="bg-red-400 hover:bg-red-500 text-white flex-1 sm:flex-none text-xs"
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        일괄 반려
                      </Button>
                    </div>
                  </div>
                  <Button
                    onClick={() => setSelectedApplications([])}
                    size="sm"
                    variant="outline"
                    className="w-full sm:w-auto text-xs"
                  >
                    선택 해제
                  </Button>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white rounded-lg border p-3 sm:p-4 gap-2">
              <div className="text-xs sm:text-sm text-gray-600">
                전체 {sortedApplications.length}건 중 {startIndex + 1}-{Math.min(endIndex, sortedApplications.length)}건
                표시
              </div>
              <div className="text-xs sm:text-sm text-gray-600">
                페이지 {currentPage} / {totalPages}
              </div>
            </div>

            {tableContentWidth > 0 && (
              <div
                ref={topScrollRef}
                onScroll={handleTopScroll}
                className="overflow-x-scroll bg-white rounded-t-lg border border-b-0"
              >
                <div style={{ width: `${tableContentWidth}px`, height: "1px" }} />
              </div>
            )}
            <div className={`bg-white ${tableContentWidth > 0 ? "rounded-b-lg border-t-0" : "rounded-lg"} border shadow-sm overflow-hidden`}>
              <div className="overflow-x-auto" ref={tableScrollRef} onScroll={handleTableScroll}>
                <table className="w-full min-w-[800px]">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-2 sm:px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = isIndeterminate
                          }}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          disabled={pendingApplications.length === 0}
                        />
                      </th>
                      <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        일자
                      </th>
                      <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        이름
                      </th>
                      <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        연락처
                      </th>
                      <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        공사계획
                      </th>
                      <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        처리
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedApplications.map((app) => (
                      <tr key={app.id} className="hover:bg-gray-50">
                        <td className="px-2 sm:px-4 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedApplications.includes(app.id)}
                            onChange={(e) => handleSelectApplication(app.id, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            disabled={app.status !== "pending"}
                          />
                        </td>
                        <td className="px-2 sm:px-4 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {getRelevantDate(app)}
                        </td>
                        <td className="px-2 sm:px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs sm:text-sm font-medium text-gray-900">{app.name}</span>
                            <div className="flex flex-col space-y-1">{getRoleBadges(app.roles)}</div>
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {app.phone}
                        </td>
                        <td className="px-2 sm:px-4 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-xs sm:text-sm font-medium text-gray-900">
                              {app.construction_plan_title}
                            </div>
                            <div className="text-xs text-gray-500">{app.construction_plan_company}</div>
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-4 whitespace-nowrap">{getStatusBadge(app.status)}</td>
                        <td className="px-2 sm:px-4 py-4 whitespace-nowrap">
                          {app.status === "pending" && (
                            <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
                              <Button
                                onClick={() => handleApprove(app.id, app.phone)}
                                size="sm"
                                className="bg-blue-400 hover:bg-blue-500 text-xs"
                              >
                                <Check className="w-3 h-3 mr-1" />
                                승인
                              </Button>
                              <Button
                                onClick={() => handleReject(app.id)}
                                size="sm"
                                className="bg-red-400 hover:bg-red-500 text-white text-xs"
                              >
                                <X className="w-3 h-3 mr-1" />
                                반려
                              </Button>
                              <Button
                                onClick={() => handleDelete(app.id, app.name)}
                                size="sm"
                                variant="outline"
                                className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 text-xs"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                          {app.status === "approved" && (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                              <div className="flex items-center text-xs sm:text-sm text-green-600">
                                <QrCode className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                QR발송완료
                              </div>
                              <Button
                                onClick={() => handleDelete(app.id, app.name)}
                                size="sm"
                                variant="outline"
                                className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 text-xs"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                          {app.status === "rejected" && (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                              <div className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-md font-medium">
                                <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1 inline" />
                                반려됨
                              </div>
                              <Button
                                onClick={() => handleDelete(app.id, app.name)}
                                size="sm"
                                variant="outline"
                                className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 text-xs"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between bg-white rounded-lg border p-3 sm:p-4 gap-3">
                <div className="flex items-center space-x-2 w-full sm:w-auto justify-center sm:justify-start">
                  <Button
                    onClick={() => setCurrentPage((prev) => prev - 1)}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    이전
                  </Button>
                  <Button
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    다음
                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                  </Button>
                </div>
                <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto justify-center">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <Button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        className={`text-xs ${currentPage === pageNum ? "bg-blue-600 text-white" : ""}`}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 sm:p-12 text-center">
              <User className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm sm:text-base text-gray-500 mb-4">출입 신청이 없습니다.</p>
              <Button onClick={handleRefresh} variant="outline" className="text-xs sm:text-sm bg-transparent">
                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                새로고침
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
