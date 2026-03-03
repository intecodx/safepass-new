"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ArrowLeft, Search, Phone, User, Calendar, Clock, Edit, Save, X, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

type Language = "ko" | "en" | "zh" | "ja"

const countries = [
  { code: "KR", name: { ko: "한국", en: "Korea", zh: "韩国", ja: "韓国" } },
  { code: "US", name: { ko: "미국", en: "United States", zh: "美国", ja: "アメリカ" } },
  { code: "CN", name: { ko: "중국", en: "China", zh: "中国", ja: "中国" } },
  { code: "JP", name: { ko: "일본", en: "Japan", zh: "日本", ja: "日本" } },
  { code: "VN", name: { ko: "베트남", en: "Vietnam", zh: "越南", ja: "ベトナム" } },
  { code: "PH", name: { ko: "필리핀", en: "Philippines", zh: "菲律宾", ja: "フィリピン" } },
  { code: "TH", name: { ko: "태국", en: "Thailand", zh: "泰国", ja: "タイ" } },
  { code: "ID", name: { ko: "인도네시아", en: "Indonesia", zh: "印度尼西亚", ja: "インドネシア" } },
  { code: "MY", name: { ko: "말레이시아", en: "Malaysia", zh: "马来西亚", ja: "マレーシア" } },
  { code: "SG", name: { ko: "싱가포르", en: "Singapore", zh: "新加坡", ja: "シンガポール" } },
  { code: "OTHER", name: { ko: "기타", en: "Other", zh: "其他", ja: "その他" } },
]

const vehicleTypes = {
  ko: ["승용차", "SUV", "트럭", "화물차", "승합차", "오토바이", "기타"],
  en: ["Sedan", "SUV", "Truck", "Cargo Vehicle", "Van", "Motorcycle", "Other"],
  zh: ["轿车", "SUV", "卡车", "货车", "面包车", "摩托车", "其他"],
  ja: ["乗用車", "SUV", "トラック", "貨物車", "バン", "オートバイ", "その他"],
}

export default function StatusPage() {
  const router = useRouter()
  const [phone, setPhone] = useState("")
  const [searchResult, setSearchResult] = useState<any>(null)
  const [multipleResults, setMultipleResults] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [language, setLanguage] = useState<Language>("ko")

  const texts = {
    ko: {
      title: "조회 및 변경",
      subtitle: "전화번호로 신청 현황을 확인하고 정보를 수정하세요",
      phoneSearch: "전화번호로 조회",
      phone: "전화번호",
      phonePlaceholder: "010-0000-0000",
      search: "조회하기",
      searching: "조회 중...",
      edit: "수정",
      save: "저장",
      cancel: "취소",
      name: "성명",
      contact: "연락처",
      nationality: "국적",
      passportNumber: "여권번호",
      role: "역할",
      vehicleInfo: "차량정보",
      applicationDate: "신청일",
      applicationTime: "신청시간",
      status: {
        pending: "승인대기",
        approved: "승인완료",
        rejected: "반려",
      },
      roles: {
        siteManager: "현장대리인",
        vehicleOwner: "차량소유자",
        general: "일반 출입자",
      },
      statusMessages: {
        pending: {
          title: "승인 대기 중",
          message:
            "관리자 승인을 기다리고 있습니다. 승인 완료 시 문자로 QR코드를 발송해드립니다.\n승인 대기 중에는 정보를 수정할 수 있습니다.",
        },
        approved: {
          title: "승인 완료",
          message: "출입 승인이 완료되었습니다. QR코드가 문자로 발송되었습니다.",
        },
        rejected: {
          title: "신청 반려",
          message: "신청이 반려되었습니다. 자세한 사항은 관리자에게 문의해주세요.",
        },
      },
      getQRAgain: "QR코드 다시 받기",
      errors: {
        phoneRequired: "전화번호를 입력해주세요.",
        notFound: "등록된 전화번호를 찾을 수 없습니다.",
        searchError: "조회 중 오류가 발생했습니다.",
        updateSuccess: "정보가 성공적으로 수정되었습니다.",
        updateError: "수정 중 오류가 발생했습니다.",
      },
    },
    en: {
      title: "Status Inquiry & Modification",
      subtitle: "Check application status and modify information using phone number",
      phoneSearch: "Search by Phone Number",
      phone: "Phone Number",
      phonePlaceholder: "010-0000-0000",
      search: "Search",
      searching: "Searching...",
      edit: "Edit",
      save: "Save",
      cancel: "Cancel",
      name: "Name",
      contact: "Contact",
      nationality: "Nationality",
      passportNumber: "Passport Number",
      role: "Role",
      vehicleInfo: "Vehicle Info",
      applicationDate: "Application Date",
      applicationTime: "Application Time",
      status: {
        pending: "Pending",
        approved: "Approved",
        rejected: "Rejected",
      },
      roles: {
        siteManager: "Site Manager",
        vehicleOwner: "Vehicle Owner",
        general: "General Visitor",
      },
      statusMessages: {
        pending: {
          title: "Approval Pending",
          message:
            "Waiting for administrator approval. QR code will be sent via SMS upon approval.\nYou can modify information while approval is pending.",
        },
        approved: {
          title: "Approved",
          message: "Access approval completed. QR code has been sent via SMS.",
        },
        rejected: {
          title: "Application Rejected",
          message: "Your application has been rejected. Please contact the administrator for details.",
        },
      },
      getQRAgain: "Get QR Code Again",
      errors: {
        phoneRequired: "Please enter phone number.",
        notFound: "No registered phone number found.",
        searchError: "An error occurred during search.",
        updateSuccess: "Information updated successfully.",
        updateError: "An error occurred during update.",
      },
    },
    zh: {
      title: "查询及变更",
      subtitle: "通过电话号码查看申请状态并修改信息",
      phoneSearch: "通过电话号码查询",
      phone: "电话号码",
      phonePlaceholder: "010-0000-0000",
      search: "查询",
      searching: "查询中...",
      edit: "修改",
      save: "保存",
      cancel: "取消",
      name: "姓名",
      contact: "联系方式",
      nationality: "国籍",
      passportNumber: "护照号码",
      role: "角色",
      vehicleInfo: "车辆信息",
      applicationDate: "申请日期",
      applicationTime: "申请时间",
      status: {
        pending: "待审批",
        approved: "已批准",
        rejected: "已拒绝",
      },
      roles: {
        siteManager: "现场代理人",
        vehicleOwner: "车辆所有者",
        general: "一般访客",
      },
      statusMessages: {
        pending: {
          title: "等待审批",
          message: "正在等待管理员审批。审批完成后将通过短信发送二维码。\n审批期间可以修改信息。",
        },
        approved: {
          title: "审批完成",
          message: "出入审批已完成。二维码已通过短信发送。",
        },
        rejected: {
          title: "申请被拒绝",
          message: "您的申请已被拒绝。详情请联系管理员。",
        },
      },
      getQRAgain: "重新获取二维码",
      errors: {
        phoneRequired: "请输入电话号码。",
        notFound: "未找到注册的电话号码。",
        searchError: "查询过程中发生错误。",
        updateSuccess: "信息更新成功。",
        updateError: "更新过程中发生错误。",
      },
    },
    ja: {
      title: "照会及び変更",
      subtitle: "電話番号で申請状況を確認し、情報を修正してください",
      phoneSearch: "電話番号で照会",
      phone: "電話番号",
      phonePlaceholder: "010-0000-0000",
      search: "照会する",
      searching: "照会中...",
      edit: "修正",
      save: "保存",
      cancel: "キャンセル",
      name: "氏名",
      contact: "連絡先",
      nationality: "国籍",
      passportNumber: "パスポート番号",
      role: "役割",
      vehicleInfo: "車両情報",
      applicationDate: "申請日",
      applicationTime: "申請時間",
      status: {
        pending: "承認待ち",
        approved: "承認完了",
        rejected: "却下",
      },
      roles: {
        siteManager: "現場代理人",
        vehicleOwner: "車両所有者",
        general: "一般入場者",
      },
      statusMessages: {
        pending: {
          title: "承認待ち",
          message:
            "管理者の承認をお待ちしています。承認完了時にSMSでQRコードを送信いたします。\n承認待ち中は情報を修正できます。",
        },
        approved: {
          title: "承認完了",
          message: "入場承認が完了しました。QRコードがSMSで送信されました。",
        },
        rejected: {
          title: "申請却下",
          message: "申請が却下されました。詳細については管理者にお問い合わせください。",
        },
      },
      getQRAgain: "QRコードを再取得",
      errors: {
        phoneRequired: "電話番号を入力してください。",
        notFound: "登録された電話番号が見つかりません。",
        searchError: "照会中にエラーが発生しました。",
        updateSuccess: "情報が正常に修正されました。",
        updateError: "修正中にエラーが発生しました。",
      },
    },
  }

  useEffect(() => {
    // 저장된 언어 설정 불러오기
    const savedLanguage = localStorage.getItem("safepass-language") as Language
    if (savedLanguage && ["ko", "en", "zh", "ja"].includes(savedLanguage)) {
      setLanguage(savedLanguage)
    }
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!phone.trim()) {
      setError(texts[language].errors.phoneRequired)
      return
    }

    setLoading(true)
    setError("")
    setSearchResult(null)
    setMultipleResults([])
    setSelectedUser(null)

    try {
      const response = await fetch(`/api/users/search?phone=${encodeURIComponent(phone.trim())}`)

      if (response.ok) {
        const result = await response.json()

        if (result.multiple) {
          // 여러 사용자가 있는 경우
          setMultipleResults(result.users)
        } else {
          // 단일 사용자인 경우
          setSearchResult(result)
          setEditData({ ...result })
        }
      } else if (response.status === 404) {
        setError(texts[language].errors.notFound)
      } else {
        setError(texts[language].errors.searchError)
      }
    } catch (error) {
      setError(texts[language].errors.searchError)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectUser = (user: any) => {
    setSelectedUser(user)
    setSearchResult(user)
    setEditData({ ...user })
    setMultipleResults([])
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditData({ ...searchResult })
  }

  const handleSaveEdit = async () => {
    try {
      const response = await fetch(`/api/users/${searchResult.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editData),
      })

      if (response.ok) {
        alert(texts[language].errors.updateSuccess)
        setSearchResult(editData)
        setIsEditing(false)
      } else {
        alert(texts[language].errors.updateError)
      }
    } catch (error) {
      console.error("수정 실패:", error)
      alert(texts[language].errors.updateError)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">{texts[language].status.pending}</Badge>
      case "approved":
        return (
          <Badge variant="default" className="bg-blue-500">
            {texts[language].status.approved}
          </Badge>
        )
      case "rejected":
        return <Badge variant="destructive">{texts[language].status.rejected}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getCountryName = (code: string) => {
    const country = countries.find((c) => c.code === code)
    return country ? country.name[language] : code
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
          <Link href="/" className="mr-4">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <img src="/images/logo.png" alt="인천종합에너지주식회사" className="h-8 mr-4" />
          <h1 className="text-xl font-semibold text-gray-900">{texts[language].title}</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 제목 섹션 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{texts[language].title}</h2>
          <p className="text-gray-600">{texts[language].subtitle}</p>
        </div>

        {/* 검색 폼 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Phone className="w-5 h-5" />
              <span>{texts[language].phoneSearch}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">{texts[language].phone}</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={texts[language].phonePlaceholder}
                  className="h-12"
                />
              </div>

              {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}

              <Button type="submit" className="w-full h-12 bg-green-600 hover:bg-green-700" disabled={loading}>
                {loading ? texts[language].searching : texts[language].search}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 여러 검색 결과 선택 */}
        {multipleResults.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{texts[language].errors.notFound}</CardTitle>
              <p className="text-sm text-gray-600">{texts[language].errors.searchError}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {multipleResults.map((user, index) => (
                  <div
                    key={user.id}
                    className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleSelectUser(user)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{user.name}</h4>
                        <p className="text-sm text-gray-600">
                          {user.construction_plan ? user.construction_plan.title : texts[language].errors.notFound}
                        </p>
                        <p className="text-xs text-gray-500">
                          {texts[language].applicationDate}: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(user.status)}
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 검색 결과 */}
        {searchResult && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>{isEditing ? editData.name : searchResult.name}</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(searchResult.status)}
                  {searchResult.status === "pending" && !isEditing && (
                    <Button onClick={handleEdit} size="sm" variant="outline">
                      <Edit className="w-4 h-4 mr-1" />
                      {texts[language].edit}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {isEditing ? (
                /* 수정 모드 */
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>{texts[language].name}</Label>
                      <Input
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{texts[language].contact}</Label>
                      <Input
                        value={editData.phone}
                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                        className="h-10"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>{texts[language].nationality}</Label>
                      <Select
                        value={editData.nationality}
                        onValueChange={(value) => setEditData({ ...editData, nationality: value })}
                      >
                        <SelectTrigger className="h-10 bg-white border-2 border-gray-300 hover:border-blue-400 focus:border-blue-500 shadow-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-lg">
                          {countries.map((country) => (
                            <SelectItem key={country.code} value={country.code} className="hover:bg-blue-50">
                              {country.name[language]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {editData.nationality !== "KR" && (
                      <div className="space-y-2">
                        <Label>{texts[language].passportNumber}</Label>
                        <Input
                          value={editData.passport_number || ""}
                          onChange={(e) => setEditData({ ...editData, passport_number: e.target.value })}
                          className="h-10"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <Label>{texts[language].role}</Label>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3 p-3 border rounded-lg">
                        <Checkbox
                          checked={editData.roles?.site_manager || false}
                          onCheckedChange={(checked) =>
                            setEditData({
                              ...editData,
                              roles: { ...editData.roles, site_manager: checked },
                            })
                          }
                        />
                        <div>
                          <Label className="font-medium">{texts[language].roles.siteManager}</Label>
                          <p className="text-sm text-gray-600">현장 관리 및 감독 업무</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-3 border rounded-lg">
                        <Checkbox
                          checked={editData.roles?.vehicle_owner || false}
                          onCheckedChange={(checked) =>
                            setEditData({
                              ...editData,
                              roles: { ...editData.roles, vehicle_owner: checked },
                            })
                          }
                        />
                        <div>
                          <Label className="font-medium">{texts[language].roles.vehicleOwner}</Label>
                          <p className="text-sm text-gray-600">차량 운행 및 관리</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {editData.roles?.vehicle_owner && (
                    <div className="grid md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                      <div className="space-y-2">
                        <Label>차량번호</Label>
                        <Input
                          value={editData.vehicle_info?.number || ""}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              vehicle_info: { ...editData.vehicle_info, number: e.target.value },
                            })
                          }
                          className="h-10"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>차량종류</Label>
                        <Select
                          value={editData.vehicle_info?.type || ""}
                          onValueChange={(value) =>
                            setEditData({
                              ...editData,
                              vehicle_info: { ...editData.vehicle_info, type: value },
                            })
                          }
                        >
                          <SelectTrigger className="h-10 bg-white border-2 border-gray-300 hover:border-blue-400 focus:border-blue-500 shadow-sm">
                            <SelectValue placeholder="차량종류 선택" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 shadow-lg">
                            {vehicleTypes[language].map((type, index) => (
                              <SelectItem key={type} value={vehicleTypes.ko[index]} className="hover:bg-blue-50">
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-3 pt-4 border-t">
                    <Button onClick={handleSaveEdit} className="bg-green-600 hover:bg-green-700">
                      <Save className="w-4 h-4 mr-2" />
                      {texts[language].save}
                    </Button>
                    <Button onClick={handleCancelEdit} variant="outline">
                      <X className="w-4 h-4 mr-2" />
                      {texts[language].cancel}
                    </Button>
                  </div>
                </div>
              ) : (
                /* 조회 모드 */
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-gray-700">{texts[language].contact}:</span>
                      <span className="ml-2">{searchResult.phone}</span>
                    </div>

                    <div>
                      <span className="font-medium text-gray-700">{texts[language].nationality}:</span>
                      <span className="ml-2">{getCountryName(searchResult.nationality)}</span>
                    </div>

                    {searchResult.nationality !== "KR" && searchResult.passport_number && (
                      <div>
                        <span className="font-medium text-gray-700">{texts[language].passportNumber}:</span>
                        <span className="ml-2">{searchResult.passport_number}</span>
                      </div>
                    )}

                    <div>
                      <span className="font-medium text-gray-700">{texts[language].role}:</span>
                      <div className="ml-2 mt-1 flex space-x-2">
                        {searchResult.roles?.site_manager && (
                          <Badge variant="outline" className="bg-green-50 text-green-800 border-green-300">
                            {texts[language].roles.siteManager}
                          </Badge>
                        )}
                        {searchResult.roles?.vehicle_owner && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-300">
                            {texts[language].roles.vehicleOwner}
                          </Badge>
                        )}
                        {!searchResult.roles?.site_manager && !searchResult.roles?.vehicle_owner && (
                          <Badge variant="outline" className="bg-gray-50 text-gray-800 border-gray-300">
                            {texts[language].roles.general}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {searchResult.vehicle_info && (
                      <div>
                        <span className="font-medium text-gray-700">{texts[language].vehicleInfo}:</span>
                        <div className="ml-2 mt-1">
                          <Badge variant="outline" className="bg-orange-50 text-orange-800 border-orange-300">
                            {searchResult.vehicle_info.number} ({searchResult.vehicle_info.type})
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-700">{texts[language].applicationDate}:</span>
                      <span>
                        {new Date(searchResult.created_at).toLocaleDateString(
                          language === "ko"
                            ? "ko-KR"
                            : language === "en"
                              ? "en-US"
                              : language === "zh"
                                ? "zh-CN"
                                : "ja-JP",
                        )}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-700">{texts[language].applicationTime}:</span>
                      <span>
                        {new Date(searchResult.created_at).toLocaleTimeString(
                          language === "ko"
                            ? "ko-KR"
                            : language === "en"
                              ? "en-US"
                              : language === "zh"
                                ? "zh-CN"
                                : "ja-JP",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 상태별 안내 메시지 */}
              {!isEditing && (
                <>
                  {searchResult.status === "pending" && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-medium text-yellow-900 mb-2">
                        {texts[language].statusMessages.pending.title}
                      </h4>
                      <p className="text-sm text-yellow-800 whitespace-pre-line">
                        {texts[language].statusMessages.pending.message}
                      </p>
                    </div>
                  )}

                  {searchResult.status === "approved" && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">
                        {texts[language].statusMessages.approved.title}
                      </h4>
                      <p className="text-sm text-green-800">{texts[language].statusMessages.approved.message}</p>
                      {searchResult.qr_code_url && (
                        <div className="mt-3">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            {texts[language].getQRAgain}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {searchResult.status === "rejected" && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-medium text-red-900 mb-2">{texts[language].statusMessages.rejected.title}</h4>
                      <p className="text-sm text-red-800">{texts[language].statusMessages.rejected.message}</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
