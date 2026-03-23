"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Search, Users, User, Car, RefreshCw } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface AdminUser {
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

export default function AdminStatusPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm])

  const fetchUsers = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const response = await fetch("/api/admin/applications")

      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      } else {
        console.error("사용자 목록 조회 실패")
        setUsers([])
      }
    } catch (error) {
      console.error("사용자 목록 조회 실패:", error)
      setUsers([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filterUsers = () => {
    let filtered = users

    // 검색어 필터링
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.phone.includes(searchTerm) ||
          user.construction_plan?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.construction_plan?.company.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredUsers(filtered)
  }

  const handleStatusChange = async (userId: number, newStatus: string) => {
    if (!confirm(`사용자의 상태를 "${getStatusText(newStatus)}"로 변경하시겠습니까?`)) {
      return
    }

    try {
      const user = users.find((u) => u.id === userId)
      if (!user) return

      let endpoint = ""
      const method = "POST"
      let body = {}

      switch (newStatus) {
        case "approved":
          endpoint = `/api/admin/applications/${userId}/approve`
          body = { phone: user.phone }
          break
        case "rejected":
          endpoint = `/api/admin/applications/${userId}/reject`
          const rejectionReason = prompt("반려 사유를 입력하세요 (선택사항):")
          body = { phone: user.phone, reason: rejectionReason || "" }
          break
        case "pending":
          // 대기 상태로 되돌리기 API (새로 만들어야 함)
          endpoint = `/api/admin/applications/${userId}/reset`
          break
        default:
          return
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        const result = await response.json()

        if (newStatus === "approved") {
          // 승인 시 SMS 발송 상태도 함께 표시
          if (result.warning) {
            alert(
              `승인이 완료되었지만 SMS 발송에 실패했습니다.\n\n${user.name}님 (${user.phone})에게 QR코드 URL을 수동으로 전달해주세요.\n\nQR코드 URL: ${result.qrCodeUrl}`,
            )
          } else {
            alert(`승인이 완료되고 ${user.name}님에게 QR코드 문자가 발송되었습니다.`)
          }
        } else if (newStatus === "rejected") {
          // 반려 시 SMS 발송 상태도 함께 표시
          if (result.warning) {
            alert(
              `반려 처리가 완료되었지만 SMS 발송에 실패했습니다.\n\n${user.name}님 (${user.phone})에게 반려 알림을 수동으로 전달해주세요.`,
            )
          } else {
            alert(`반려 처리가 완료되고 ${user.name}님에게 알림 문자가 발송되었습니다.`)
          }
        } else {
          alert(`상태가 "${getStatusText(newStatus)}"로 변경되었습니다.`)
        }

        fetchUsers()
      } else {
        const errorData = await response.json()
        alert(errorData.error || "상태 변경 중 오류가 발생했습니다.")
      }
    } catch (error) {
      console.error("상태 변경 실패:", error)
      alert("상태 변경 중 오류가 발생했습니다.")
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

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "승인대기"
      case "approved":
        return "승인완료"
      case "rejected":
        return "반려"
      default:
        return status
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

  const getAvailableStatusChanges = (currentStatus: string) => {
    switch (currentStatus) {
      case "pending":
        return [
          { value: "approved", label: "승인완료" },
          { value: "rejected", label: "반려" },
        ]
      case "approved":
        return [
          { value: "rejected", label: "반려" },
          { value: "pending", label: "승인대기로 되돌리기" },
        ]
      case "rejected":
        return [
          { value: "pending", label: "승인대기로 되돌리기" },
          { value: "approved", label: "승인완료" },
        ]
      default:
        return []
    }
  }

  const stats = {
    total: users.length,
    pending: users.filter((u) => u.status === "pending").length,
    approved: users.filter((u) => u.status === "approved").length,
    rejected: users.filter((u) => u.status === "rejected").length,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">사용자 목록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
          <div className="flex items-center w-full sm:w-auto">
            <Link href="/admin/dashboard" className="mr-2 sm:mr-4">
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
            </Link>
            <img src="/images/logo.png" alt="인천종합에너지주식회사" className="h-6 sm:h-8 mr-2 sm:mr-4" />
            <h1 className="text-base sm:text-xl font-semibold text-gray-900">승인 조회/변경</h1>
          </div>
          <Button
            onClick={() => fetchUsers(true)}
            variant="outline"
            size="sm"
            disabled={refreshing}
            className="flex items-center space-x-2 bg-transparent w-full sm:w-auto text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "새로고침 중..." : "새로고침"}</span>
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* 검색 및 필터 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="w-5 h-5" />
              <span>검색</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>검색어</Label>
              <Input
                placeholder="이름, 전화번호, 공사계획, 업체명으로 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* 사용자 목록 */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">사용자 목록</h2>
            <div className="text-xs sm:text-sm text-gray-600">
              {filteredUsers.length}명 표시 (전체 {users.length}명)
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        신청일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        이름
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        연락처
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        국적
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        공사계획
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        역할
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        처리
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(user.created_at).toLocaleDateString("ko-KR")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-500">
                            {user.gender === "male" ? "남성" : "여성"} •{" "}
                            {new Date(user.birth_date).toLocaleDateString("ko-KR")}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.phone}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>{user.nationality === "KR" ? "한국" : "외국"}</div>
                          {user.nationality !== "KR" && user.passport_number && (
                            <div className="text-xs text-gray-500">{user.passport_number}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.construction_plan ? (
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.construction_plan.title}</div>
                              <div className="text-xs text-gray-500">{user.construction_plan.company}</div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">미지정</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">{getRoleBadges(user.roles)}</div>
                          {user.vehicle_info && (
                            <div className="mt-1">
                              <Badge
                                variant="outline"
                                className="bg-orange-50 text-orange-800 border-orange-300 text-xs"
                              >
                                <Car className="w-3 h-3 mr-1" />
                                {user.vehicle_info.number}
                              </Badge>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(user.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {getAvailableStatusChanges(user.status).map((statusChange) => (
                              <button
                                key={statusChange.value}
                                onClick={() => handleStatusChange(user.id, statusChange.value)}
                                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                              >
                                {statusChange.label}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {filteredUsers.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  {searchTerm ? "검색 조건에 맞는 사용자가 없습니다." : "등록된 사용자가 없습니다."}
                </p>
                {searchTerm && (
                  <Button onClick={() => setSearchTerm("")} variant="outline">
                    검색 초기화
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
