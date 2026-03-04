"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Users, Building, Briefcase, RefreshCw, TrendingUp, BarChart3, Globe } from 'lucide-react'
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

  // 도넛 차트 컴포넌트 (개선된 버전)
  const DonutChart = ({
    data,
    centerValue,
    centerLabel,
  }: {
    data: Array<{ label: string; value: number; color: string }>
    centerValue: number
    centerLabel: string
  }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0)
    if (total === 0) return <div className="text-center text-gray-400 py-8">데이터가 없습니다</div>

    let cumulativePercentage = 0
    const radius = 54
    const strokeWidth = 14
    const circumference = 2 * Math.PI * radius

    return (
      <div className="flex flex-col items-center w-full">
        <div className="relative mb-4">
          <svg width="140" height="140" className="transform -rotate-90 drop-shadow-sm">
            <circle cx="70" cy="70" r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100
              const dashLength = (percentage / 100) * circumference
              const dashOffset = -(cumulativePercentage / 100) * circumference
              cumulativePercentage += percentage

              return (
                <circle
                  key={index}
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${dashLength} ${circumference}`}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                  style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.1))" }}
                />
              )
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-gray-900">{centerValue.toLocaleString()}</div>
            <div className="text-xs text-gray-500 font-medium">{centerLabel}</div>
          </div>
        </div>
        <div className="w-full space-y-2.5">
          {data.map((item, index) => {
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0
            return (
              <div key={index} className="flex items-center justify-between group">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white shadow-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-600 truncate group-hover:text-gray-900 transition-colors">
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                  <span className="text-xs text-gray-400 font-medium">{pct}%</span>
                  <span className="text-sm font-semibold text-gray-800">{item.value.toLocaleString()}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // SVG 라인 차트 컴포넌트 (7일 추이용)
  const TrendChart = ({
    dailyStats,
  }: {
    dailyStats: Array<{ date: string; registrations: number; approvals: number }>
  }) => {
    const chartWidth = 700
    const chartHeight = 160
    const padding = { top: 20, right: 30, bottom: 40, left: 40 }
    const innerWidth = chartWidth - padding.left - padding.right
    const innerHeight = chartHeight - padding.top - padding.bottom

    const maxReg = Math.max(...dailyStats.map((d) => d.registrations), 1)
    const maxApp = Math.max(...dailyStats.map((d) => d.approvals), 1)
    const maxVal = Math.max(maxReg, maxApp, 1)

    const getX = (i: number) => padding.left + (i / Math.max(dailyStats.length - 1, 1)) * innerWidth
    const getY = (val: number) => padding.top + innerHeight - (val / maxVal) * innerHeight

    const buildPath = (key: "registrations" | "approvals") => {
      return dailyStats
        .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(d[key])}`)
        .join(" ")
    }

    const buildAreaPath = (key: "registrations" | "approvals") => {
      const linePath = dailyStats.map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(d[key])}`).join(" ")
      return `${linePath} L ${getX(dailyStats.length - 1)} ${padding.top + innerHeight} L ${getX(0)} ${padding.top + innerHeight} Z`
    }

    // 가로 눈금선
    const gridLines = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
      y: padding.top + innerHeight * (1 - ratio),
      label: Math.round(maxVal * ratio),
    }))

    return (
      <div className="w-full overflow-hidden">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
          <defs>
            <linearGradient id="regGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="appGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* 눈금선 */}
          {gridLines.map((line, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={line.y}
                x2={chartWidth - padding.right}
                y2={line.y}
                stroke="#e5e7eb"
                strokeWidth="0.5"
                strokeDasharray={i === 0 ? "none" : "4 4"}
              />
              <text x={padding.left - 8} y={line.y + 3} textAnchor="end" fontSize="10" fill="#9ca3af">
                {line.label}
              </text>
            </g>
          ))}

          {/* 영역 채우기 */}
          <path d={buildAreaPath("registrations")} fill="url(#regGradient)" />
          <path d={buildAreaPath("approvals")} fill="url(#appGradient)" />

          {/* 라인 */}
          <path d={buildPath("registrations")} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d={buildPath("approvals")} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* 데이터 포인트 + 날짜 라벨 */}
          {dailyStats.map((day, i) => {
            const dateLabel = new Date(day.date).toLocaleDateString("ko-KR", {
              month: "numeric",
              day: "numeric",
            })
            const weekday = new Date(day.date).toLocaleDateString("ko-KR", { weekday: "short" })
            return (
              <g key={i}>
                {/* 세로 가이드 */}
                <line
                  x1={getX(i)}
                  y1={padding.top}
                  x2={getX(i)}
                  y2={padding.top + innerHeight}
                  stroke="#f1f5f9"
                  strokeWidth="0.5"
                />
                {/* 신청 포인트 */}
                <circle cx={getX(i)} cy={getY(day.registrations)} r="4" fill="white" stroke="#3b82f6" strokeWidth="2" />
                {day.registrations > 0 && (
                  <text x={getX(i)} y={getY(day.registrations) - 10} textAnchor="middle" fontSize="9" fill="#3b82f6" fontWeight="600">
                    {day.registrations}
                  </text>
                )}
                {/* 승인 포인트 */}
                <circle cx={getX(i)} cy={getY(day.approvals)} r="4" fill="white" stroke="#10b981" strokeWidth="2" />
                {day.approvals > 0 && (
                  <text x={getX(i)} y={getY(day.approvals) - 10} textAnchor="middle" fontSize="9" fill="#10b981" fontWeight="600">
                    {day.approvals}
                  </text>
                )}
                {/* 날짜 라벨 */}
                <text x={getX(i)} y={chartHeight - 16} textAnchor="middle" fontSize="10" fill="#6b7280">
                  {dateLabel}
                </text>
                <text x={getX(i)} y={chartHeight - 4} textAnchor="middle" fontSize="9" fill="#9ca3af">
                  {weekday}
                </text>
              </g>
            )
          })}
        </svg>

        {/* 범례 */}
        <div className="flex justify-center space-x-6 mt-2">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-0.5 bg-blue-500 rounded-full" />
            <span className="text-xs text-gray-500">신청</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-0.5 bg-emerald-500 rounded-full" />
            <span className="text-xs text-gray-500">승인</span>
          </div>
        </div>
      </div>
    )
  }

  // 랭킹 막대 차트 컴포넌트
  const RankBarChart = ({
    data,
    accentColor = "blue",
  }: {
    data: Array<{ label: string; value: number }>
    accentColor?: "blue" | "purple"
  }) => {
    const max = Math.max(...data.map((item) => item.value), 1)
    const gradients = {
      blue: "from-blue-500 to-cyan-400",
      purple: "from-purple-500 to-indigo-400",
    }
    const rankColors = ["bg-yellow-400 text-yellow-900", "bg-gray-300 text-gray-700", "bg-amber-600 text-amber-100"]

    return (
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="group">
            <div className="flex items-center space-x-3">
              {/* 순위 뱃지 */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  index < 3 ? rankColors[index] : "bg-gray-100 text-gray-500"
                }`}
              >
                {index + 1}
              </div>
              {/* 바 영역 */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <span
                    className="text-sm text-gray-700 truncate max-w-[180px] group-hover:text-gray-900 transition-colors"
                    title={item.label}
                  >
                    {item.label}
                  </span>
                  <span className="text-sm font-bold text-gray-800 ml-2 flex-shrink-0">
                    {item.value.toLocaleString()}<span className="text-xs font-normal text-gray-500 ml-0.5">명</span>
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`bg-gradient-to-r ${gradients[accentColor]} h-2.5 rounded-full transition-all duration-700 ease-out`}
                    style={{
                      width: `${Math.max((item.value / max) * 100, 2)}%`,
                      opacity: 1 - index * 0.08,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">통계를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!statistics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex justify-center items-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">통계를 불러올 수 없습니다.</p>
          <Button onClick={() => fetchStatistics()}>다시 시도</Button>
        </div>
      </div>
    )
  }

  const domesticPct =
    statistics.totalUsers > 0
      ? Math.round((statistics.nationalityBreakdown.domestic / statistics.totalUsers) * 100)
      : 0
  const foreignPct = 100 - domesticPct

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/admin/dashboard" className="mr-4 hover:bg-gray-100 rounded-lg p-1.5 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </Link>
            <img src="/images/logo.png" alt="인천종합에너지주식회사" className="h-8 mr-4" />
            <h1 className="text-xl font-bold text-gray-900">출입 통계</h1>
          </div>
          <Button
            onClick={() => fetchStatistics(true)}
            variant="outline"
            size="sm"
            disabled={refreshing}
            className="flex items-center space-x-2 bg-white hover:bg-gray-50 border-gray-200"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "새로고침 중..." : "새로고침"}</span>
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* 요약 카드 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">총 출입 인원</p>
                <p className="text-3xl font-bold mt-1">{statistics.totalUsers.toLocaleString()}<span className="text-lg ml-1 font-normal text-blue-200">명</span></p>
              </div>
              <div className="bg-white/20 rounded-xl p-3">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">참여 업체</p>
                <p className="text-3xl font-bold mt-1">{statistics.totalCompanies.toLocaleString()}<span className="text-lg ml-1 font-normal text-emerald-200">개</span></p>
              </div>
              <div className="bg-white/20 rounded-xl p-3">
                <Building className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl p-5 text-white shadow-lg shadow-violet-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-violet-100 text-sm font-medium">진행 작업</p>
                <p className="text-3xl font-bold mt-1">{statistics.totalProjects.toLocaleString()}<span className="text-lg ml-1 font-normal text-violet-200">개</span></p>
              </div>
              <div className="bg-white/20 rounded-xl p-3">
                <Briefcase className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* 도넛 차트 3개 */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-0 shadow-md shadow-gray-200/50 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-center space-x-2 text-base text-gray-700">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span>상태별 현황</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center px-6 pb-6">
              <DonutChart
                centerValue={statistics.totalUsers}
                centerLabel="명"
                data={[
                  { label: "승인대기", value: statistics.statusBreakdown.pending, color: "#eab308" },
                  { label: "승인완료", value: statistics.statusBreakdown.approved, color: "#3b82f6" },
                  { label: "퇴근완료", value: statistics.statusBreakdown.completed, color: "#10b981" },
                  { label: "반려", value: statistics.statusBreakdown.rejected, color: "#ef4444" },
                ]}
              />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md shadow-gray-200/50 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-center space-x-2 text-base text-gray-700">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>업체별 분포</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center px-6 pb-6">
              <DonutChart
                centerValue={statistics.totalCompanies}
                centerLabel="개 업체"
                data={statistics.companyBreakdown.slice(0, 5).map((item, index) => ({
                  label: item.company,
                  value: item.count,
                  color: ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"][index] || "#6b7280",
                }))}
              />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md shadow-gray-200/50 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-center space-x-2 text-base text-gray-700">
                <div className="w-2 h-2 rounded-full bg-violet-500" />
                <span>작업별 분포</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center px-6 pb-6">
              <DonutChart
                centerValue={statistics.totalProjects}
                centerLabel="개 작업"
                data={statistics.projectBreakdown.slice(0, 5).map((item, index) => ({
                  label: item.project,
                  value: item.count,
                  color: ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"][index] || "#6b7280",
                }))}
              />
            </CardContent>
          </Card>
        </div>

        {/* 최근 7일 추이 - SVG 라인 차트 */}
        <Card className="border-0 shadow-md shadow-gray-200/50 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-2 text-base text-gray-700">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span>최근 7일 출입 추이</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <TrendChart dailyStats={statistics.dailyStats} />
          </CardContent>
        </Card>

        {/* 업체별 + 프로젝트별 랭킹 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-0 shadow-md shadow-gray-200/50 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-base text-gray-700">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                <span>업체별 출입 현황</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <RankBarChart
                accentColor="blue"
                data={statistics.companyBreakdown.slice(0, 8).map((item) => ({
                  label: item.company,
                  value: item.count,
                }))}
              />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md shadow-gray-200/50 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-base text-gray-700">
                <Briefcase className="w-4 h-4 text-purple-500" />
                <span>프로젝트별 출입 현황</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <RankBarChart
                accentColor="purple"
                data={statistics.projectBreakdown.slice(0, 8).map((item) => ({
                  label: item.project,
                  value: item.count,
                }))}
              />
            </CardContent>
          </Card>
        </div>

        {/* 국적별 분포 */}
        <Card className="border-0 shadow-md shadow-gray-200/50 rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-base text-gray-700">
              <Globe className="w-4 h-4 text-indigo-500" />
              <span>국적별 분포</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {/* 비율 바 */}
            <div className="mb-5">
              <div className="flex rounded-full h-4 overflow-hidden shadow-inner">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-700 flex items-center justify-center"
                  style={{ width: `${Math.max(domesticPct, 2)}%` }}
                >
                  {domesticPct > 15 && <span className="text-[10px] font-bold text-white">{domesticPct}%</span>}
                </div>
                <div
                  className="bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700 flex items-center justify-center"
                  style={{ width: `${Math.max(foreignPct, 2)}%` }}
                >
                  {foreignPct > 15 && <span className="text-[10px] font-bold text-white">{foreignPct}%</span>}
                </div>
              </div>
            </div>
            {/* 상세 카드 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-blue-50/80 rounded-xl border border-blue-100/50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                    <span className="text-white text-lg">🇰🇷</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-800">국내</span>
                    <p className="text-xs text-blue-600 font-medium">{domesticPct}%</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {statistics.nationalityBreakdown.domestic.toLocaleString()}
                  <span className="text-sm font-normal text-blue-400 ml-1">명</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-emerald-50/80 rounded-xl border border-emerald-100/50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                    <span className="text-white text-lg">🌏</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-800">해외</span>
                    <p className="text-xs text-emerald-600 font-medium">{foreignPct}%</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-emerald-600">
                  {statistics.nationalityBreakdown.foreign.toLocaleString()}
                  <span className="text-sm font-normal text-emerald-400 ml-1">명</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
