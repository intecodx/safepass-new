"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ArrowLeft, Plus, FileText, X } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ConstructionPlan {
  id: number
  title: string
  description: string
  company: string
  work_company?: string // New field for work company
  start_date: string
  end_date: string
  site_manager: string
  site_manager_phone?: string // Added site manager phone field
  supervisor?: string
  status: string
  created_at: string
  userCount?: number // 사용자 수 추가
}

export default function ConstructionPlansPage() {
  const [plans, setPlans] = useState<ConstructionPlan[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false) // 폼 제출 상태 추가
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    company: "INTECO", // Default value set to INTECO
    work_company: "", // New field for work company
    start_date: "",
    end_date: "",
    site_manager: "",
    site_manager_phone: "", // Added site manager phone to form state
    supervisor: "",
    status: "planned",
  })

  // 폼 유효성 검사 상태
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // useState에 편집 상태 추가
  const [editingPlan, setEditingPlan] = useState<ConstructionPlan | null>(null)
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    company: "",
    work_company: "", // New field for work company
    start_date: "",
    end_date: "",
    site_manager: "",
    site_manager_phone: "", // Added site manager phone to edit form state
    supervisor: "",
    status: "planned",
  })

  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    console.log("🚀 ConstructionPlansPage 컴포넌트 마운트됨")
    fetchPlans()
  }, []) // 빈 의존성 배열로 컴포넌트 마운트 시에만 실행

  const fetchPlans = async () => {
    try {
      console.log("🔄 공사계획 목록 조회 시작...")
      setLoading(true)

      const response = await fetch("/api/admin/construction-plans")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("📋 API에서 받은 공사계획 데이터:", data)

      if (!Array.isArray(data)) {
        console.error("❌ 응답 데이터가 배열이 아닙니다:", data)
        setPlans([])
        return
      }

      const today = new Date().toISOString().split("T")[0]
      const expiredPlans = data.filter((plan: ConstructionPlan) => plan.end_date < today && plan.status !== "completed")

      // 만료된 공사계획들을 완료 상태로 업데이트
      if (expiredPlans.length > 0) {
        console.log(`🔄 ${expiredPlans.length}개의 만료된 공사계획을 완료 상태로 변경 중...`)

        const updatePromises = expiredPlans.map(async (plan: ConstructionPlan) => {
          try {
            const updateResponse = await fetch(`/api/admin/construction-plans/${plan.id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                ...plan,
                status: "completed",
              }),
            })

            if (updateResponse.ok) {
              console.log(`✅ 공사계획 ${plan.id} (${plan.title}) 자동 완료 처리됨`)
              return { ...plan, status: "completed" }
            } else {
              console.warn(`⚠️ 공사계획 ${plan.id} 자동 완료 처리 실패`)
              return plan
            }
          } catch (error) {
            console.error(`❌ 공사계획 ${plan.id} 자동 완료 처리 중 오류:`, error)
            return plan
          }
        })

        await Promise.all(updatePromises)

        // 업데이트된 데이터 다시 조회
        const updatedResponse = await fetch("/api/admin/construction-plans")
        if (updatedResponse.ok) {
          const updatedData = await updatedResponse.json()
          data.splice(0, data.length, ...updatedData)
        }
      }

      // 각 공사계획별 사용자 수 조회
      const plansWithUserCount = await Promise.all(
        data.map(async (plan: ConstructionPlan) => {
          try {
            const userResponse = await fetch(`/api/admin/construction-plans/${plan.id}/users`)
            if (userResponse.ok) {
              const userData = await userResponse.json()
              return {
                ...plan,
                userCount: userData.success ? userData.count : 0,
              }
            } else {
              console.warn(`⚠️ 공사계획 ${plan.id} 사용자 수 조회 실패:`, userResponse.status)
              return {
                ...plan,
                userCount: 0,
              }
            }
          } catch (error) {
            console.error(`❌ 공사계획 ${plan.id} 사용자 수 조회 실패:`, error)
            return {
              ...plan,
              userCount: 0,
            }
          }
        }),
      )

      console.log(`✅ 총 ${plansWithUserCount.length}개의 공사계획 로드 완료`)
      setPlans(plansWithUserCount)
    } catch (error) {
      console.error("❌ 공사계획 조회 실패:", error)
      setPlans([])
    } finally {
      setLoading(false)
    }
  }

  // 폼 유효성 검사
  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.title.trim()) {
      errors.title = "공사명을 입력해주세요."
    }
    if (!formData.company.trim()) {
      errors.company = "발주처를 입력해주세요."
    }
    if (!formData.work_company.trim()) {
      errors.work_company = "작업업체를 입력해주세요."
    }
    if (!formData.start_date) {
      errors.start_date = "시작일을 선택해주세요."
    }
    if (!formData.end_date) {
      errors.end_date = "종료일을 선택해주세요."
    }
    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      errors.end_date = "종료일은 시작일보다 이르면 안됩니다."
    }
    if (!formData.site_manager.trim()) {
      errors.site_manager = "현장대리인을 입력해주세요." // 현장관리자 → 현장대리인으로 변경
    }
    if (!formData.site_manager_phone.trim()) {
      errors.site_manager_phone = "현장대리인 전화번호를 입력해주세요."
    }
    if (!formData.supervisor.trim()) {
      errors.supervisor = "감독자를 입력해주세요." // 감독자를 필수 입력으로 변경
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setSubmitting(true) // 폼 제출 시작

    try {
      const response = await fetch("/api/admin/construction-plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const result = await response.json()
        alert("공사계획이 성공적으로 등록되었습니다! 외부근로자가 이제 이 공사를 선택할 수 있습니다.")
        setShowForm(false)
        setFormData({
          title: "",
          description: "",
          company: "INTECO", // Reset to default value
          work_company: "", // Reset work company field
          start_date: "",
          end_date: "",
          site_manager: "",
          site_manager_phone: "", // Reset site manager phone field
          supervisor: "",
          status: "planned",
        })
        setFormErrors({})

        // 성공적으로 등록된 공사계획을 로컬 상태에 즉시 추가
        if (result.success && result.id) {
          const newPlan: ConstructionPlan = {
            id: result.id,
            title: formData.title,
            description: formData.description,
            company: formData.company,
            work_company: formData.work_company, // Include work_company
            start_date: formData.start_date,
            end_date: formData.end_date,
            site_manager: formData.site_manager,
            site_manager_phone: formData.site_manager_phone, // Include site manager phone
            supervisor: formData.supervisor,
            status: formData.status,
            created_at: new Date().toISOString(),
            userCount: 0,
          }

          setPlans((prevPlans) => [newPlan, ...prevPlans])
          console.log("✅ 새 공사계획이 로컬 상태에 추가됨:", newPlan)
        }

        // 데이터가 완전히 저장된 후 목록 새로고침
        setTimeout(() => {
          fetchPlans()
        }, 500)
      } else {
        const errorData = await response.json()
        alert(`공사계획 등록 실패: ${errorData.message || "알 수 없는 오류"}`)
      }
    } catch (error) {
      console.error("공사계획 등록 실패:", error)
      alert("공사계획 등록 중 오류가 발생했습니다.")
    } finally {
      setSubmitting(false) // 폼 제출 종료
    }
  }

  const handleStartDateChange = (date: string) => {
    const newFormData = { ...formData, start_date: date }
    if (date && formData.end_date && date === formData.end_date) {
      newFormData.status = "ongoing"
    }
    setFormData(newFormData)
  }

  const handleEndDateChange = (date: string) => {
    const newFormData = { ...formData, end_date: date }
    if (date && formData.start_date && date === formData.start_date) {
      newFormData.status = "ongoing"
    }
    setFormData(newFormData)
  }

  const handleEditStartDateChange = (date: string) => {
    const newEditFormData = { ...editFormData, start_date: date }
    if (date && editFormData.end_date && date === editFormData.end_date) {
      newEditFormData.status = "ongoing"
    }
    setEditFormData(newEditFormData)
  }

  const handleEditEndDateChange = (date: string) => {
    const newEditFormData = { ...editFormData, end_date: date }
    if (date && editFormData.start_date && date === editFormData.start_date) {
      newEditFormData.status = "ongoing"
    }
    setEditFormData(newEditFormData)
  }

  const getStatusBadge = (status: string, startDate?: string, endDate?: string) => {
    if (startDate && endDate && startDate === endDate) {
      return (
        <Badge variant="default" className="bg-orange-500">
          1일 공사
        </Badge>
      )
    }

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
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // 수정 시작 함수 추가
  const handleEditStart = (plan: ConstructionPlan) => {
    setEditingPlan(plan)
    setEditFormData({
      title: plan.title,
      description: plan.description,
      company: plan.company,
      work_company: plan.work_company || "", // Include work_company
      start_date: plan.start_date,
      end_date: plan.end_date,
      site_manager: plan.site_manager,
      site_manager_phone: plan.site_manager_phone || "", // Include site manager phone
      supervisor: plan.supervisor || "",
      status: plan.status,
    })
    setShowEditModal(true)
  }

  // 수정 취소 함수 추가
  const handleEditCancel = () => {
    setEditingPlan(null)
    setEditFormData({
      title: "",
      description: "",
      company: "",
      work_company: "", // Reset work_company
      start_date: "",
      end_date: "",
      site_manager: "",
      site_manager_phone: "", // Reset site manager phone
      supervisor: "",
      status: "planned",
    })
    setShowEditModal(false)
  }

  // 수정 저장 함수 추가
  const handleEditSave = async () => {
    if (!editingPlan) return

    try {
      const response = await fetch(`/api/admin/construction-plans/${editingPlan.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editFormData),
      })

      if (response.ok) {
        alert("공사계획이 수정되었습니다.")
        setEditingPlan(null)
        setShowEditModal(false)
        fetchPlans()
      } else {
        const errorData = await response.json()
        alert(errorData.error || "공사계획 수정 중 오류가 발생했습니다.")
      }
    } catch (error) {
      console.error("공사계획 수정 실패:", error)
      alert("공사계획 수정 중 오류가 발생했습니다.")
    }
  }

  // 삭제 함수 추가
  const handleDelete = async (planId: number, planTitle: string) => {
    if (!confirm(`"${planTitle}" 공사계획을 삭제하시겠습니까?\n\n연결된 사용자가 있는 경우 삭제할 수 없습니다.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/construction-plans/${planId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        alert("공사계획이 삭제되었습니다.")
        fetchPlans()
      } else {
        const errorData = await response.json()
        alert(errorData.error || "공사계획 삭제 중 오류가 발생했습니다.")
      }
    } catch (error) {
      console.error("공사계획 삭제 실패:", error)
      alert("공사계획 삭제 중 오류가 발생했습니다.")
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">로딩 중...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/admin/dashboard" className="mr-2 sm:mr-4">
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
            </Link>
            <img src="/images/logo.png" alt="인천종합에너지주식회사" className="h-6 sm:h-8 mr-2 sm:mr-4" />
            <h1 className="text-base sm:text-xl font-semibold text-gray-900">공사계획 관리</h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* 공사계획 등록 폼 */}
        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>새 공사계획 등록</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-base font-medium">
                      작업명 *
                    </Label>
                    <Input
                      id="title"
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      onFocus={(e) => {
                        if (e.target.placeholder === "예: A동 전기공사") {
                          e.target.placeholder = ""
                        }
                      }}
                      onBlur={(e) => {
                        if (!formData.title && e.target.placeholder === "") {
                          e.target.placeholder = "예: A동 전기공사"
                        }
                      }}
                      required
                      placeholder="예: A동 전기공사"
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-base font-medium">
                      발주처 *
                    </Label>
                    <Input
                      id="company"
                      type="text"
                      value="INTECO"
                      readOnly
                      disabled
                      className="h-12 bg-gray-100 text-gray-700 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-base font-medium">
                      공사계획 및 내용 *
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      placeholder="공사 내용, 작업 범위, 주요 작업 사항 등을 상세히 입력해주세요"
                      className="min-h-[120px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="work_company" className="text-base font-medium">
                      작업업체 *
                    </Label>
                    <Input
                      id="work_company"
                      type="text"
                      value={formData.work_company}
                      onChange={(e) => setFormData({ ...formData, work_company: e.target.value })}
                      onFocus={(e) => {
                        if (e.target.placeholder === "예: (주)한국전기공사") {
                          e.target.placeholder = ""
                        }
                      }}
                      onBlur={(e) => {
                        if (!formData.work_company && e.target.placeholder === "") {
                          e.target.placeholder = "예: (주)한국전기공사"
                        }
                      }}
                      required
                      placeholder="예: (주)한국전기공사"
                      className="h-12"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="start_date" className="text-base font-medium">
                      공사 시작일 *
                    </Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      required
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_date" className="text-base font-medium">
                      공사 종료일 *
                    </Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => handleEndDateChange(e.target.value)}
                      required
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-medium">공사 상태</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue>
                          {formData.start_date && formData.end_date && formData.start_date === formData.end_date
                            ? "1일 공사"
                            : formData.status === "planned"
                              ? "계획"
                              : formData.status === "ongoing"
                                ? "진행중"
                                : formData.status === "completed"
                                  ? "완료"
                                  : formData.status}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planned">계획</SelectItem>
                        <SelectItem value="ongoing">진행중</SelectItem>
                        <SelectItem value="completed">완료</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="supervisor" className="text-base font-medium">
                      감독자 * {/* 필수 입력으로 변경 */}
                    </Label>
                    <Input
                      id="supervisor"
                      type="text"
                      value={formData.supervisor}
                      onChange={(e) => setFormData({ ...formData, supervisor: e.target.value })}
                      onFocus={(e) => {
                        if (e.target.placeholder === "감독자 성명") {
                          e.target.placeholder = ""
                        }
                      }}
                      onBlur={(e) => {
                        if (!formData.supervisor && e.target.placeholder === "") {
                          e.target.placeholder = "감독자 성명"
                        }
                      }}
                      required // required 속성 추가
                      placeholder="감독자 성명"
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="site_manager" className="text-base font-medium">
                      현장대리인 * {/* 현장관리자 → 현장대리인으로 변경 */}
                    </Label>
                    <Input
                      id="site_manager"
                      type="text"
                      value={formData.site_manager}
                      onChange={(e) => setFormData({ ...formData, site_manager: e.target.value })}
                      onFocus={(e) => {
                        if (e.target.placeholder === "현장대리인 성명") {
                          // placeholder 텍스트 변경
                          e.target.placeholder = ""
                        }
                      }}
                      onBlur={(e) => {
                        if (!formData.site_manager && e.target.placeholder === "") {
                          e.target.placeholder = "현장대리인 성명" // placeholder 텍스트 변경
                        }
                      }}
                      required
                      placeholder="현장대리인 성명"
                      className="h-12"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="site_manager_phone" className="text-base font-medium">
                      현장대리인 전화번호 *
                    </Label>
                    <Input
                      id="site_manager_phone"
                      type="tel"
                      value={formData.site_manager_phone}
                      onChange={(e) => setFormData({ ...formData, site_manager_phone: e.target.value })}
                      onFocus={(e) => {
                        if (e.target.placeholder === "예: 010-1234-5678") {
                          e.target.placeholder = ""
                        }
                      }}
                      onBlur={(e) => {
                        if (!formData.site_manager_phone && e.target.placeholder === "") {
                          e.target.placeholder = "예: 010-1234-5678"
                        }
                      }}
                      required
                      placeholder="예: 010-1234-5678"
                      className="h-12"
                    />
                  </div>
                </div>

                <div className="flex space-x-4 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                    취소
                  </Button>
                  <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={submitting}>
                    {submitting ? "등록 중..." : "공사계획 등록"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* 공사계획 목록 */}
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">등록된 공사계획</h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                총 {plans.length}개 • {loading ? "로딩 중..." : "준비됨"}
              </p>
            </div>
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <Button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none text-sm"
                disabled={submitting}
              >
                <Plus className="w-4 h-4 mr-2" />새 공사계획 등록
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                        등록일
                      </th>
                      <th className="px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                        공사명
                      </th>
                      <th className="px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                        발주처
                      </th>
                      <th className="px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                        작업업체
                      </th>
                      <th className="px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                        현장대리인 {/* 테이블 헤더도 현장관리자 → 현장대리인으로 변경 */}
                      </th>
                      <th className="px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                        현장대리인 전화번호
                      </th>
                      <th className="px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                        감독자
                      </th>
                      <th className="px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                        공사기간
                      </th>
                      <th className="px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                        신청자
                      </th>
                      <th className="px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                        처리
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {plans.map((plan) => (
                      <tr key={plan.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm sm:text-base text-gray-900">
                          {new Date(plan.created_at).toLocaleDateString("ko-KR")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm sm:text-base font-medium text-gray-900">{plan.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm sm:text-base text-gray-900">{plan.company}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm sm:text-base text-gray-900">{plan.work_company || "-"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm sm:text-base text-gray-900">{plan.site_manager}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm sm:text-base text-gray-900">{plan.site_manager_phone || "-"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm sm:text-base text-gray-900">{plan.supervisor || "-"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm sm:text-base text-gray-900">
                          <div>
                            <div>{new Date(plan.start_date).toLocaleDateString("ko-KR")}</div>
                            <div className="text-xs sm:text-sm text-gray-500">
                              ~ {new Date(plan.end_date).toLocaleDateString("ko-KR")}
                            </div>
                            <div className="text-xs sm:text-sm text-blue-600">
                              ({calculateDuration(plan.start_date, plan.end_date)}일간)
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(plan.status, plan.start_date, plan.end_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm sm:text-base text-gray-900">
                          <span className="font-medium">{plan.userCount ?? 0}명</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm sm:text-base font-medium">
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditStart(plan)}>
                              수정
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                              onClick={() => handleDelete(plan.id, plan.title)}
                            >
                              삭제
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {plans.length === 0 && !loading && (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">등록된 공사계획이 없습니다.</p>
                <p className="text-sm sm:text-base text-gray-400 mb-6">
                  새로운 공사계획을 등록하여 외부근로자들이 신청할 수 있도록 하세요.
                </p>
                <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />첫 공사계획 등록하기
                </Button>
              </CardContent>
            </Card>
          )}

          {loading && (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">공사계획 목록을 불러오는 중...</p>
              </CardContent>
            </Card>
          )}
        </div>

        {showEditModal && editingPlan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="bg-blue-50 border-b">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl font-bold text-blue-900">공사계획 수정</CardTitle>
                  <Button variant="ghost" size="sm" onClick={handleEditCancel}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 bg-white">
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="edit-title" className="text-base font-medium">
                        작업명 *
                      </Label>
                      <Input
                        id="edit-title"
                        type="text"
                        value={editFormData.title}
                        onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                        className="h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-company" className="text-base font-medium">
                        발주처 *
                      </Label>
                      <Input
                        id="edit-company"
                        type="text"
                        value="INTECO"
                        readOnly
                        disabled
                        className="h-12 bg-gray-100 text-gray-700 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="edit-description" className="text-base font-medium">
                        공사계획 및 내용 *
                      </Label>
                      <Textarea
                        id="edit-description"
                        value={editFormData.description}
                        onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                        className="min-h-[120px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-work_company" className="text-base font-medium">
                        작업업체 *
                      </Label>
                      <Input
                        id="edit-work_company"
                        type="text"
                        value={editFormData.work_company}
                        onChange={(e) => setEditFormData({ ...editFormData, work_company: e.target.value })}
                        className="h-12"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="edit-start_date" className="text-base font-medium">
                        공사 시작일 *
                      </Label>
                      <Input
                        id="edit-start_date"
                        type="date"
                        value={editFormData.start_date}
                        onChange={(e) => handleEditStartDateChange(e.target.value)}
                        className="h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-end_date" className="text-base font-medium">
                        공사 종료일 *
                      </Label>
                      <Input
                        id="edit-end_date"
                        type="date"
                        value={editFormData.end_date}
                        onChange={(e) => handleEditEndDateChange(e.target.value)}
                        className="h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base font-medium">공사 상태</Label>
                      <Select
                        value={editFormData.status}
                        onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue>
                            {editFormData.start_date &&
                            editFormData.end_date &&
                            editFormData.start_date === editFormData.end_date
                              ? "1일 공사"
                              : editFormData.status === "planned"
                                ? "계획"
                                : editFormData.status === "ongoing"
                                  ? "진행중"
                                  : editFormData.status === "completed"
                                    ? "완료"
                                    : editFormData.status}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planned">계획</SelectItem>
                          <SelectItem value="ongoing">진행중</SelectItem>
                          <SelectItem value="completed">완료</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="edit-supervisor" className="text-base font-medium">
                        감독자 *
                      </Label>
                      <Input
                        id="edit-supervisor"
                        type="text"
                        value={editFormData.supervisor}
                        onChange={(e) => setEditFormData({ ...editFormData, supervisor: e.target.value })}
                        className="h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-site_manager" className="text-base font-medium">
                        현장대리인 *
                      </Label>
                      <Input
                        id="edit-site_manager"
                        type="text"
                        value={editFormData.site_manager}
                        onChange={(e) => setEditFormData({ ...editFormData, site_manager: e.target.value })}
                        className="h-12"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="edit-site_manager_phone" className="text-base font-medium">
                        현장대리인 전화번호 *
                      </Label>
                      <Input
                        id="edit-site_manager_phone"
                        type="tel"
                        value={editFormData.site_manager_phone}
                        onChange={(e) => setEditFormData({ ...editFormData, site_manager_phone: e.target.value })}
                        className="h-12"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-4 pt-4">
                    <Button variant="outline" onClick={handleEditCancel} className="flex-1 bg-transparent">
                      취소
                    </Button>
                    <Button onClick={handleEditSave} className="flex-1 bg-blue-600 hover:bg-blue-700">
                      저장
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
