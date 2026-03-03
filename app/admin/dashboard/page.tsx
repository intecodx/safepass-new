"use client"

import { useState, useEffect } from "react"
import { Users, CheckCircle, Clock, BarChart3, ClipboardList } from "lucide-react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"

interface DashboardStats {
  pending: number
  approved: number
  rejected: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    pending: 0,
    approved: 0,
    rejected: 0,
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats")
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("통계 조회 실패:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* 인사말 */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">안녕하세요 INTECO 관리자님! 👋</h2>
          <p className="text-sm sm:text-base text-gray-600">오늘 하루도 화이팅하세요!</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-xl font-bold text-yellow-600 mb-0.5">{stats.pending}</div>
              <div className="text-yellow-800 font-medium text-xs">승인대기</div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-xl font-bold text-blue-600 mb-0.5">{stats.approved}</div>
              <div className="text-blue-800 font-medium text-xs">승인완료</div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-xl font-bold text-red-600 mb-0.5">{stats.rejected}</div>
              <div className="text-red-800 font-medium text-xs">반려 신청</div>
            </CardContent>
          </Card>
        </div>

        {/* 메뉴 */}
        <div className="space-y-3 sm:space-y-6">
          <Link href="/admin/entry-status">
            <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer bg-teal-50 border-teal-200">
              <CardContent className="p-4 sm:p-6 flex items-center justify-between">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-teal-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 text-teal-700" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-teal-900">출입 현황</h3>
                    <p className="text-xs sm:text-sm text-teal-600 hidden sm:block">Real-time Entry & Exit Status</p>
                  </div>
                </div>
                <div className="text-teal-400 text-lg sm:text-xl">{">"}</div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/applications">
            <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer bg-blue-50 border-blue-200">
              <CardContent className="p-4 sm:p-6 flex items-center justify-between">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-blue-900">출입 신청 관리</h3>
                    <p className="text-xs sm:text-sm text-blue-600 hidden sm:block">방문자 및 차량 등록 통합 관리</p>
                  </div>
                </div>
                <div className="text-blue-400 text-lg sm:text-xl">{">"}</div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/construction-plans">
            <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer bg-purple-50 border-purple-200">
              <CardContent className="p-4 sm:p-6 flex items-center justify-between">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-purple-700" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-purple-900">공사계획 관리</h3>
                    <p className="text-xs sm:text-sm text-purple-600 hidden sm:block">Construction Plan Management</p>
                  </div>
                </div>
                <div className="text-purple-400 text-lg sm:text-xl">{">"}</div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/status">
            <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer bg-orange-50 border-orange-200">
              <CardContent className="p-4 sm:p-6 flex items-center justify-between">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-orange-700" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-orange-900">승인 조회/변경</h3>
                    <p className="text-xs sm:text-sm text-orange-600 hidden sm:block">Quick Status/Inquire</p>
                  </div>
                </div>
                <div className="text-orange-400 text-lg sm:text-xl">{">"}</div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/statistics">
            <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer bg-green-50 border-green-200">
              <CardContent className="p-4 sm:p-6 flex items-center justify-between">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-green-700" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-green-900">출입 통계</h3>
                    <p className="text-xs sm:text-sm text-green-600 hidden sm:block">Access Statistics & Analytics</p>
                  </div>
                </div>
                <div className="text-green-700 text-lg sm:text-xl">{">"}</div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  )
}
