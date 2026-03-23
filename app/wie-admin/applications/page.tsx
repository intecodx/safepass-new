"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Check, X, QrCode, User, Car, RefreshCw, Trash2 } from "lucide-react"
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
}

interface GroupedApplications {
  plan: {
    id: number
    title: string
    company: string
  }
  applications: Application[]
}

export default function WIEApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedApplications, setSelectedApplications] = useState<number[]>([])
  const [selectedByPlan, setSelectedByPlan] = useState<Record<string, number[]>>({})
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>("all")
  const [plans, setPlans] = useState<{ id: number; title: string; company: string }[]>([])

  useEffect(() => {
    fetchPlans()
    fetchApplications()
  }, [])

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

  const fetchApplications = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      console.log("WIE 신청 목록 조회 시작...")
      const response = await fetch("/api/wie-admin/applications")

      console.log("응답 상태:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("받은 데이터:", data)
        setApplications(data)
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

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/wie-admin/construction-plans")
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

  const handleApprove = async (id: number, phone: string) => {
    try {
      const response = await fetch(`/api/wie-admin/applications/${id}/approve`, {
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
      const response = await fetch(`/api/wie-admin/applications/${id}/reject`, {
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

      const response = await fetch(`/api/wie-admin/applications/${id}/delete`, {
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
          const response = await fetch(`/api/wie-admin/applications/${id}/approve`, {
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
        const response = await fetch(`/api/wie-admin/applications/${id}/reject`, {
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
          const response = await fetch(`/api/wie-admin/applications/${id}/approve`, {
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
        const response = await fetch(`/api/wie-admin/applications/${id}/reject`, {
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

  const handleRefresh = () => {
    fetchApplications(true)
    fetchPlans()
    setSelectedApplications([])
    setSelectedByPlan({})
    setSelectedPlanFilter("all")
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">승인대기</Badge>
      case "approved":
        return (
          <Badge variant="default" className="bg-purple-500">
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
        <Badge key="vehicle-owner" variant="outline" className="bg-purple-50 text-purple-800 border-purple-300">
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">신청 목록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const selectableIds = flatApplications.filter((app) => app.status === "pending").map((app) => app.id)
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

  const pendingApplications = flatApplications.filter((app) => app.status === "pending")
  const isAllSelected =
    pendingApplications.length > 0 && pendingApplications.every((app) => selectedApplications.includes(app.id))
  const isIndeterminate = pendingApplications.some((app) => selectedApplications.includes(app.id)) && !isAllSelected

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-20 lg:relative">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div className="flex items-center">
            <Link href="/wie-admin/dashboard" className="mr-3 sm:mr-4">
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
            </Link>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">출입 신청 관리</h1>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={refreshing}
            className="flex items-center space-x-2 bg-transparent w-full sm:w-auto"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "새로고침 중..." : "새로고침"}</span>
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
        <div className="mb-4 sm:mb-6 bg-white rounded-lg border p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <Label htmlFor="plan-filter" className="text-sm font-medium text-gray-700 sm:whitespace-nowrap">
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
              <Badge
                variant="outline"
                className="bg-purple-50 text-purple-800 border-purple-300 w-full sm:w-auto text-center"
              >
                필터링 중: {constructionPlans.find((p) => p.id.toString() === selectedPlanFilter)?.title}
              </Badge>
            )}
          </div>
        </div>

        <div className="mb-6 sm:mb-8 bg-white rounded-lg border p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            {selectedPlanFilter === "all" ? "전체 현황" : "선택된 공사계획 현황"}
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{flatApplications.length}</div>
              <div className="text-sm text-purple-800">전체 신청</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {flatApplications.filter((app) => app.status === "pending").length}
              </div>
              <div className="text-sm text-yellow-800">승인 대기</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {flatApplications.filter((app) => app.status === "approved").length}
              </div>
              <div className="text-sm text-green-800">승인 완료</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {flatApplications.filter((app) => app.status === "rejected").length}
              </div>
              <div className="text-sm text-red-800">반려</div>
            </div>
          </div>
        </div>

        {flatApplications.length > 0 ? (
          <div className="space-y-4">
            {selectedApplications.length > 0 && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <span className="text-sm font-medium text-purple-800">
                      {selectedApplications.length}개 항목 선택됨
                    </span>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleBulkApprove}
                        size="sm"
                        className="bg-purple-400 hover:bg-purple-500 flex-1 sm:flex-none"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        일괄 승인
                      </Button>
                      <Button
                        onClick={handleBulkReject}
                        size="sm"
                        className="bg-red-400 hover:bg-red-500 text-white flex-1 sm:flex-none"
                      >
                        <X className="w-4 h-4 mr-1" />
                        일괄 반려
                      </Button>
                    </div>
                  </div>
                  <Button
                    onClick={() => setSelectedApplications([])}
                    size="sm"
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    선택 해제
                  </Button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = isIndeterminate
                          }}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          disabled={pendingApplications.length === 0}
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        신청일
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        신청시간
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        이름
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        연락처
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        공사계획
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        처리
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {flatApplications.map((app) => (
                      <tr key={app.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedApplications.includes(app.id)}
                            onChange={(e) => handleSelectApplication(app.id, e.target.checked)}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            disabled={app.status !== "pending"}
                          />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(app.created_at).toLocaleDateString("ko-KR")}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(app.created_at).toLocaleTimeString("ko-KR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">{app.name}</span>
                            <div className="flex space-x-1">{getRoleBadges(app.roles)}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{app.phone}</td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{app.construction_plan_title}</div>
                            <div className="text-sm text-gray-500">{app.construction_plan_company}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">{getStatusBadge(app.status)}</td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {app.status === "pending" && (
                            <div className="flex space-x-2">
                              <Button
                                onClick={() => handleApprove(app.id, app.phone)}
                                size="sm"
                                className="bg-purple-400 hover:bg-purple-500"
                              >
                                <Check className="w-3 h-3 mr-1" />
                                승인
                              </Button>
                              <Button
                                onClick={() => handleReject(app.id)}
                                size="sm"
                                className="bg-red-400 hover:bg-red-500 text-white"
                              >
                                <X className="w-3 h-3 mr-1" />
                                반려
                              </Button>
                              <Button
                                onClick={() => handleDelete(app.id, app.name)}
                                size="sm"
                                variant="outline"
                                className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                          {app.status === "approved" && (
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center text-sm text-green-600">
                                <QrCode className="w-4 h-4 mr-1" />
                                QR발송완료
                              </div>
                              <Button
                                onClick={() => handleDelete(app.id, app.name)}
                                size="sm"
                                variant="outline"
                                className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                          {app.status === "rejected" && (
                            <div className="flex items-center space-x-2">
                              <div className="px-2 py-1 bg-red-100 text-red-800 text-sm rounded-md font-medium">
                                <X className="w-4 h-4 mr-1 inline" />
                                반려됨
                              </div>
                              <Button
                                onClick={() => handleDelete(app.id, app.name)}
                                size="sm"
                                variant="outline"
                                className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
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
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">출입 신청이 없습니다.</p>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                새로고침
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
