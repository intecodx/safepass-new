"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Users, Building, Briefcase, RefreshCw, TrendingUp, BarChart3 } from 'lucide-react'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AccessStatistics {
  totalUsers: number
  totalCompanies: number
  totalProjects: number
  statusBreakdown: {
    pending: number
    approved: number
    completed: number
    rejected: number
  }
  companyBreakdown: Array<{
    company: string
    count: number
    percentage: number
  }>
  projectBreakdown: Array<{
    project: string
    company: string
    count: number
    percentage: number
  }>
  roleBreakdown: {
    siteManagers: number
    vehicleOwners: number
    generalWorkers: number
  }
  nationalityBreakdown: {
    domestic: number
    foreign: number
  }
  dailyStats: Array<{
    date: string
    registrations: number
    approvals: number
  }>
}

export default function StatisticsPage() {
  const [statistics, setStatistics] = useState<AccessStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchStatistics()
  }, [])

  const fetchStatistics = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const response = await fetch("/api/admin/statistics", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStatistics(data)
      } else {
        console.error("통계 조회 실패")
      }
    } catch (error) {
      console.error("통계 조회 실패:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // 도넛 차트 컴포넌트
  const DonutChart = ({
    data,
    title,
    colors,
    centerValue,
    centerLabel,
  }: {
    data: Array<{ label: string; value: number; color: string }>
    title: string
    colors: string[]
    centerValue: number
    centerLabel: string
  }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0)
    if (total === 0) return <div className="text-center text-gray-500 py-8">데이터가 없습니다</div>

    let cumulativePercentage = 0
    const radius = 50
    const strokeWidth = 12

    return (
      <div className="flex flex-col items-center w-full">
        <div className="relative mb-3">
          <svg width="120" height="120" className="transform -rotate-90">
            <circle cx="60" cy="60" r={radius} fill="none" stroke="#f3f4f6" strokeWidth={strokeWidth} />
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100
              const strokeDasharray = `${percentage * 2.042} 204.2`
              const strokeDashoffset = -cumulativePercentage * 2.042
              cumulativePercentage += percentage

              return (
                <circle
                  key={index}
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500"
                />
              )
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-xl font-bold text-gray-900">{centerValue.toLocaleString()}</div>
            <div className="text-xs text-gray-600">{centerLabel}</div>
          </div>
        </div>
        <div className="w-full space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm text-gray-700 truncate">{item.label}</span>
              </div>
              <span className="text-sm font-medium text-gray-900 ml-2">{item.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 막대 차트 컴포넌트
  const BarChart = ({
    data,
    title,
    maxValue,
  }: {
    data: Array<{ label: string; value: number }>
    title: string
    maxValue?: number
  }) => {
    const max = maxValue || Math.max(...data.map((item) => item.value), 1)

    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900 text-center">{title}</h4>
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700 truncate max-w-[200px]" title={item.label}>
                  {item.label}
                </span>
                <span className="font-medium text-gray-900">{item.value}명</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(item.value / max) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">통계를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!statistics) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">통계를 불러올 수 없습니다.</p>
          <Button onClick={() => fetchStatistics()}>다시 시도</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/admin/dashboard" className="mr-4">
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </Link>
            <img src="/images/logo.png" alt="인천종합에너지주식회사" className="h-8 mr-4" />
            <h1 className="text-xl font-semibold text-gray-900">출입 통계</h1>
          </div>
          <Button
            onClick={() => fetchStatistics(true)}
            variant="outline"
            size="sm"
            disabled={refreshing}
            className="flex items-center space-x-2 bg-transparent"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "새로고침 중..." : "새로고침"}</span>
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 메인 통계 도넛 차트 */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* 총 출입 인원 도넛 차트 */}
          <Card className="h-full min-w-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-center space-x-2 text-lg">
                <Users className="w-5 h-5 text-blue-600" />
                <span>총 출입 인원</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <DonutChart
                title="총 출입 인원"
                centerValue={statistics.totalUsers}
                centerLabel="명"
                colors={["#eab308", "#3b82f6", "#10b981", "#ef4444"]}
                data={[
                  { label: "승인대기", value: statistics.statusBreakdown.pending, color: "#eab308" },
                  { label: "승인완료", value: statistics.statusBreakdown.approved, color: "#3b82f6" },
                  { label: "퇴근완료", value: statistics.statusBreakdown.completed, color: "#10b981" },
                  { label: "반려", value: statistics.statusBreakdown.rejected, color: "#ef4444" },
                ]}
              />
            </CardContent>
          </Card>

          {/* 참여 업체 수 도넛 차트 */}
          <Card className="h-full min-w-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-center space-x-2 text-lg">
                <Building className="w-5 h-5 text-green-600" />
                <span>참여 업체 수</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <DonutChart
                title="참여 업체 수"
                centerValue={statistics.totalCompanies}
                centerLabel="개 업체"
                colors={["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"]}
                data={statistics.companyBreakdown.slice(0, 5).map((item, index) => ({
                  label: item.company,
                  value: 1,
                  color: ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"][index] || "#6b7280",
                }))}
              />
            </CardContent>
          </Card>

          {/* 진행 작업 수 도넛 차트 */}
          <Card className="h-full min-w-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-center space-x-2 text-lg">
                <Briefcase className="w-5 h-5 text-purple-600" />
                <span>진행 작업 수</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <DonutChart
                title="진행 작업 수"
                centerValue={statistics.totalProjects}
                centerLabel="개 작업"
                colors={["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"]}
                data={statistics.projectBreakdown.slice(0, 5).map((item, index) => ({
                  label: item.project,
                  value: 1,
                  color: ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"][index] || "#6b7280",
                }))}
              />
            </CardContent>
          </Card>
        </div>

        {/* 최근 7일 추이를 도넛차트 바로 밑으로 이동 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>최근 7일 출입 추이</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-4">
              {statistics.dailyStats.map((day, index) => (
                <div key={index} className="text-center space-y-2">
                  <div className="text-sm text-gray-600">
                    {new Date(day.date).toLocaleDateString("ko-KR", {
                      month: "short",
                      day: "numeric",
                      weekday: "short",
                    })}
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-blue-600">신청 {day.registrations}</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${day.registrations > 0 ? Math.max((day.registrations / Math.max(...statistics.dailyStats.map((d) => d.registrations), 1)) * 100, 5) : 0}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-green-600">승인 {day.approvals}</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${day.approvals > 0 ? Math.max((day.approvals / Math.max(...statistics.dailyStats.map((d) => d.approvals), 1)) * 100, 5) : 0}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 업체별 및 프로젝트별 통계 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 업체별 통계 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>업체별 출입 현황</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart
                title="업체별 인원 수"
                data={statistics.companyBreakdown.slice(0, 8).map((item) => ({
                  label: item.company,
                  value: item.count,
                }))}
              />
            </CardContent>
          </Card>

          {/* 프로젝트별 통계 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>프로젝트별 출입 현황</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart
                title="프로젝트별 인원 수"
                data={statistics.projectBreakdown.slice(0, 8).map((item) => ({
                  label: item.project,
                  value: item.count,
                }))}
              />
            </CardContent>
          </Card>
        </div>

        {/* 국적별 통계만 남김 (일별 추이는 위로 이동했으므로 제거) */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>국적별 분포</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                    <span className="font-medium">국내</span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{statistics.nationalityBreakdown.domestic}</div>
                    <div className="text-sm text-blue-700">
                      {statistics.totalUsers > 0
                        ? Math.round((statistics.nationalityBreakdown.domestic / statistics.totalUsers) * 100)
                        : 0}
                      %
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span className="font-medium">해외</span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">{statistics.nationalityBreakdown.foreign}</div>
                    <div className="text-sm text-green-700">
                      {statistics.totalUsers > 0
                        ? Math.round((statistics.nationalityBreakdown.foreign / statistics.totalUsers) * 100)
                        : 0}
                      %
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
