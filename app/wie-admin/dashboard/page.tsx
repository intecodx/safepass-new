"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Users, HardHat, CheckCircle, BarChart3, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface DashboardStats {
  totalApplications: number
  pendingApplications: number
  approvedApplications: number
  rejectedApplications: number
  totalConstructionPlans: number
  activeConstructionPlans: number
  completedConstructionPlans: number
  todayApplications: number
}

export default function WieAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
    totalConstructionPlans: 0,
    activeConstructionPlans: 0,
    completedConstructionPlans: 0,
    todayApplications: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/wie-admin/dashboard/stats")
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error("통계 데이터 로드 실패:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  const navigationCards = [
    {
      title: "신청 관리",
      description: "출입 신청서를 검토하고 승인/거부 처리",
      href: "/wie-admin/applications",
      icon: Users,
      color: "bg-blue-500",
      stats: `${stats.pendingApplications}건 대기중`,
    },
    {
      title: "공사 계획",
      description: "공사 계획을 등록하고 관리",
      href: "/wie-admin/construction-plans",
      icon: HardHat,
      color: "bg-orange-500",
      stats: `${stats.activeConstructionPlans}건 진행중`,
    },
    {
      title: "승인 조회/변경",
      description: "승인된 신청서의 상태를 조회하고 변경",
      href: "/wie-admin/status",
      icon: CheckCircle,
      color: "bg-green-500",
      stats: `${stats.approvedApplications}건 승인됨`,
    },
    {
      title: "통계",
      description: "신청 현황과 통계를 확인",
      href: "/wie-admin/statistics",
      icon: BarChart3,
      color: "bg-purple-500",
      stats: `총 ${stats.totalApplications}건`,
    },
  ]

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Welcome Section */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">WIE 관리자 대시보드에 오신 것을 환영합니다</h1>
        <p className="text-sm sm:text-base text-gray-600">
          오늘 {new Date().toLocaleDateString("ko-KR")} 현재 시스템 현황을 확인하세요.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 신청서</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApplications}</div>
            <p className="text-xs text-muted-foreground">오늘 {stats.todayApplications}건 신규</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">대기중 신청</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingApplications}</div>
            <p className="text-xs text-muted-foreground">검토 필요</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">승인된 신청</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approvedApplications}</div>
            <p className="text-xs text-muted-foreground">
              전체의{" "}
              {stats.totalApplications > 0
                ? Math.round((stats.approvedApplications / stats.totalApplications) * 100)
                : 0}
              %
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">진행중 공사</CardTitle>
            <HardHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.activeConstructionPlans}</div>
            <p className="text-xs text-muted-foreground">총 {stats.totalConstructionPlans}건 중</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {navigationCards.map((card) => (
          <Link key={card.title} href={card.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className={`${card.color} p-3 rounded-lg`}>
                    <card.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{card.title}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{card.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-sm">
                    {card.stats}
                  </Badge>
                  <span className="text-sm text-purple-600 font-medium">바로가기 →</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
