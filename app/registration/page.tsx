"use client"


import type React from "react"
import { useState, useEffect } from "react"
import { ArrowLeft, User, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Logo } from "@/components/ui/logo"

type Language = "ko" | "en" | "zh" | "ja"

export default function RegistrationPage() {
  const router = useRouter()
  const [nationality, setNationality] = useState("KR")
  const [selectedClient, setSelectedClient] = useState<string>("")
  const [roles, setRoles] = useState({
    siteManager: false,
    vehicleOwner: false,
  })
  const [agreements, setAgreements] = useState({
    service: false,
    privacy: false,
  })

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    passportNumber: "",
    birthDate: "",
    gender: "",
    bloodType: "",
    vehicleNumber: "",
    vehicleType: "",
  })

  const [constructionPlans, setConstructionPlans] = useState<ConstructionPlan[]>([])
  const [selectedPlan, setSelectedPlan] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [planDetails, setPlanDetails] = useState<ConstructionPlan | null>(null)
  const [language, setLanguage] = useState<Language>("ko")

  const texts = {
    ko: {
      title: "출입 신청",
      subtitle: "출입을 위한 정보를 입력해주세요",
      clientSelection: "발주처 선택",
      selectClient: "발주처 선택 *",
      selectClientPlaceholder: "발주처를 선택하세요",
      constructionPlan: "공사계획 선택",
      selectPlan: "참여할 공사계획 선택 *",
      selectPlanPlaceholder: "공사계획을 선택하세요",
      loadingPlans: "공사계획 로딩 중...",
      noPlans: "현재 진행 중인 공사계획이 없습니다.",
      retryButton: "다시 시도",
      company: "업체",
      siteManager: "현장관리자",
      nationalityInfo: "국적 정보",
      selectNationality: "국적 선택 *",
      passportNumber: "여권번호 *",
      passportPlaceholder: "여권번호를 입력하세요",
      termsAgreement: "이용약관 동의",
      termsContent:
        "본 약관은 인천종합에너지주식회사에서 제공하는 출입 관리 시스템 서비스의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다. 개인정보는 출입 관리, 보안 관리, 비상연락 목적으로만 사용되며, 출입 완료 후 1년간 보관됩니다. 수집된 개인정보는 관련 법령에 따라 안전하게 관리되며, 목적 달성 후 지체없이 파기됩니다.",
      serviceTerms: "서비스 이용약관에 동의합니다 (필수)",
      privacyTerms: "개인정보 취급방침에 동의합니다 (필수)",
      basicInfo: "기본정보",
      name: "성명 *",
      namePlaceholder: "홍길동",
      phone: "연락처 *",
      phonePlaceholder: "010-0000-0000",
      email: "이메일",
      emailPlaceholder: "example@email.com",
      birthDate: "생년월일 *",
      gender: "성별 *",
      genderPlaceholder: "성별을 선택하세요",
      bloodType: "혈액형 *",
      bloodTypePlaceholder: "혈액형을 선택하세요",
      aType: "A형",
      bType: "B형",
      abType: "AB형",
      oType: "O형",
      male: "남성",
      female: "여성",
      roleSelection: "역할 선택",
      roleSubtitle: "해당하는 역할을 선택해주세요 (선택사항)",
      siteManagerRole: "현장대리인",
      siteManagerDesc: "현장 관리 및 감독 업무",
      vehicleOwnerRole: "차량소유자",
      vehicleOwnerDesc: "차량 운행 및 관리",
      vehicleInfo: "차량 정보",
      vehicleInfoDesc: "차량소유자로 선택하신 경우 차량 정보를 입력해주세요",
      vehicleNumber: "차량번호 *",
      vehicleNumberPlaceholder: "예: 12가3456",
      vehicleType: "차량종류 *",
      vehicleTypePlaceholder: "차량종류 선택",
      selectedRole: "선택된 역할",
      vehicleInfoSummary: "차량정보",
      finalAgreement: "위 내용이 사실임을 확인하며, 출입 관련 규정을 준수할 것을 서약합니다.",
      previous: "이전",
      submit: "출입 신청하기",
      alerts: {
        selectClient: "발주처를 선택해주세요.",
        selectPlan: "참여할 공사계획을 선택해주세요.",
        agreeTerms: "필수 약관에 동의해주세요.",
        vehicleInfo: "차량소유자를 선택한 경우 차량번호와 차량종류를 입력해주세요.",
        success: "출입 신청이 완료되었습니다. 관리자 승인 후 문자로 QR코드를 발송해드립니다.",
        error: "신청 중 오류가 발생했습니다.",
      },
    },
    en: {
      title: "Access Application",
      subtitle: "Please enter your information for access",
      clientSelection: "Client Selection",
      selectClient: "Select Client *",
      selectClientPlaceholder: "Please select a client",
      constructionPlan: "Construction Plan Selection",
      selectPlan: "Select Construction Plan to Participate *",
      selectPlanPlaceholder: "Please select a construction plan",
      loadingPlans: "Loading construction plans...",
      noPlans: "No ongoing construction plans available.",
      retryButton: "Retry",
      company: "Company",
      siteManager: "Site Manager",
      nationalityInfo: "Nationality Information",
      selectNationality: "Select Nationality *",
      passportNumber: "Passport Number *",
      passportPlaceholder: "Enter your passport number",
      termsAgreement: "Terms Agreement",
      termsContent:
        "These terms are intended to stipulate the rights, obligations, responsibilities, and other necessary matters between the company and users regarding the use of the access management system service provided by Incheon Integrated Energy Co., Ltd. Personal information is used only for access management, security management, and emergency contact purposes, and is stored for one year after access completion. Collected personal information is safely managed in accordance with relevant laws and is destroyed without delay after achieving its purpose.",
      serviceTerms: "I agree to the Terms of Service (Required)",
      privacyTerms: "I agree to the Privacy Policy (Required)",
      basicInfo: "Basic Information",
      name: "Name *",
      namePlaceholder: "John Doe",
      phone: "Phone *",
      phonePlaceholder: "010-0000-0000",
      email: "Email",
      emailPlaceholder: "example@email.com",
      birthDate: "Date of Birth *",
      gender: "Gender *",
      genderPlaceholder: "Select gender",
      bloodType: "Blood Type *",
      bloodTypePlaceholder: "Select blood type",
      aType: "A",
      bType: "B",
      abType: "AB",
      oType: "O",
      male: "Male",
      female: "Female",
      roleSelection: "Role Selection",
      roleSubtitle: "Please select applicable roles (Optional)",
      siteManagerRole: "Site Manager",
      siteManagerDesc: "Site management and supervision",
      vehicleOwnerRole: "Vehicle Owner",
      vehicleOwnerDesc: "Vehicle operation and management",
      vehicleInfo: "Vehicle Information",
      vehicleInfoDesc: "Please enter vehicle information if you selected vehicle owner",
      vehicleNumber: "Vehicle Number *",
      vehicleNumberPlaceholder: "e.g., 12가3456",
      vehicleType: "Vehicle Type *",
      vehicleTypePlaceholder: "Select vehicle type",
      selectedRole: "Selected Role",
      vehicleInfoSummary: "Vehicle Info",
      finalAgreement:
        "I confirm that the above information is true and pledge to comply with access-related regulations.",
      previous: "Previous",
      submit: "Submit Application",
      alerts: {
        selectClient: "Please select a client.",
        selectPlan: "Please select a construction plan to participate.",
        agreeTerms: "Please agree to the required terms.",
        vehicleInfo: "Please enter vehicle number and type if you selected vehicle owner.",
        success: "Access application completed successfully. QR code will be sent via SMS after admin approval.",
        error: "An error occurred during application.",
      },
    },
    zh: {
      title: "出入申请",
      subtitle: "请输入您的出入信息",
      clientSelection: "发包方选择",
      selectClient: "选择发包方 *",
      selectClientPlaceholder: "请选择发包方",
      constructionPlan: "施工计划选择",
      selectPlan: "选择参与的施工计划 *",
      selectPlanPlaceholder: "请选择施工计划",
      loadingPlans: "正在加载施工计划...",
      noPlans: "目前没有进行中的施工计划。",
      retryButton: "重试",
      company: "公司",
      siteManager: "现场管理员",
      nationalityInfo: "国籍信息",
      selectNationality: "选择国籍 *",
      passportNumber: "护照号码 *",
      passportPlaceholder: "请输入护照号码",
      termsAgreement: "使用条款同意",
      termsContent:
        "本条款旨在规定仁川综合能源株式会社提供的出入管理系统服务使用相关的公司与用户之间的权利、义务及责任事项等必要事项。个人信息仅用于出入管理、安全管理、紧急联系目的，出入完成后保存1年。收集的个人信息按照相关法律安全管理，达成目的后立即销毁。",
      serviceTerms: "我同意服务使用条款（必需）",
      privacyTerms: "我同意隐私政策（必需）",
      basicInfo: "基本信息",
      name: "姓名 *",
      namePlaceholder: "张三",
      phone: "联系方式 *",
      phonePlaceholder: "010-0000-0000",
      email: "邮箱",
      emailPlaceholder: "example@email.com",
      birthDate: "出生日期 *",
      gender: "性别 *",
      genderPlaceholder: "请选择性别",
      bloodType: "血型 *",
      bloodTypePlaceholder: "请选择血型",
      aType: "A型",
      bType: "B型",
      abType: "AB型",
      oType: "O型",
      male: "男性",
      female: "女性",
      roleSelection: "角色选择",
      roleSubtitle: "请选择适用的角色（可选）",
      siteManagerRole: "现场代理人",
      siteManagerDesc: "现场管理和监督工作",
      vehicleOwnerRole: "车辆所有者",
      vehicleOwnerDesc: "车辆运行和管理",
      vehicleInfo: "车辆信息",
      vehicleInfoDesc: "如果您选择了车辆所有者，请输入车辆信息",
      vehicleNumber: "车牌号 *",
      vehicleNumberPlaceholder: "例：12가3456",
      vehicleType: "车辆类型 *",
      vehicleTypePlaceholder: "选择车辆类型",
      selectedRole: "已选择角色",
      vehicleInfoSummary: "车辆信息",
      finalAgreement: "我确认以上内容属实，并承诺遵守出入相关规定。",
      previous: "上一步",
      submit: "提交申请",
      alerts: {
        selectClient: "请选择发包方。",
        selectPlan: "请选择要参与的施工计划。",
        agreeTerms: "请同意必需条款。",
        vehicleInfo: "如果选择了车辆所有者，请输入车牌号和车辆类型。",
        success: "出入申请提交成功。管理员批准后将通过短信发送二维码。",
        error: "申请过程中发生错误。",
      },
    },
    ja: {
      title: "入場申請",
      subtitle: "入場のための情報を入力してください",
      clientSelection: "発注者選択",
      selectClient: "発注者選択 *",
      selectClientPlaceholder: "発注者を選択してください",
      constructionPlan: "工事計画選択",
      selectPlan: "参加する工事計画を選択 *",
      selectPlanPlaceholder: "工事計画を選択してください",
      loadingPlans: "工事計画を読み込み中...",
      noPlans: "現在進行中の工事計画がありません。",
      retryButton: "再試行",
      company: "会社",
      siteManager: "現場管理者",
      nationalityInfo: "国籍情報",
      selectNationality: "国籍選択 *",
      passportNumber: "パスポート番号 *",
      passportPlaceholder: "パスポート番号を入力してください",
      termsAgreement: "利用規約同意",
      termsContent:
        "本規約は、仁川総合エネルギー株式会社が提供する入場管理システムサービスの利用に関して、会社と利用者間の権利、義務及び責任事項、その他必要な事項を規定することを目的とします。個人情報は入場管理、セキュリティ管理、緊急連絡目的でのみ使用され、入場完了後1年間保管されます。収集された個人情報は関連法令に従って安全に管理され、目的達成後遅滞なく破棄されます。",
      serviceTerms: "サービス利用規約に同意します（必須）",
      privacyTerms: "プライバシーポリシーに同意します（必須）",
      basicInfo: "基本情報",
      name: "氏名 *",
      namePlaceholder: "田中太郎",
      phone: "連絡先 *",
      phonePlaceholder: "010-0000-0000",
      email: "メール",
      emailPlaceholder: "example@email.com",
      birthDate: "生年月日 *",
      gender: "性別 *",
      genderPlaceholder: "性別を選択してください",
      bloodType: "血液型 *",
      bloodTypePlaceholder: "血液型を選択してください",
      aType: "A型",
      bType: "B型",
      abType: "AB型",
      oType: "O型",
      male: "男性",
      female: "女性",
      roleSelection: "役割選択",
      roleSubtitle: "該当する役割を選択してください（任意）",
      siteManagerRole: "現場代理人",
      siteManagerDesc: "現場管理及び監督業務",
      vehicleOwnerRole: "車両所有者",
      vehicleOwnerDesc: "車両運行及び管理",
      vehicleInfo: "車両情報",
      vehicleInfoDesc: "車両所有者を選択した場合は車両情報を入力してください",
      vehicleNumber: "車両番号 *",
      vehicleNumberPlaceholder: "例：12が3456",
      vehicleType: "車両種類 *",
      vehicleTypePlaceholder: "車両種類選択",
      selectedRole: "選択された役割",
      vehicleInfoSummary: "車両情報",
      finalAgreement: "上記内容が事実であることを確認し、入場関連規定を遵守することを誓約します。",
      previous: "前へ",
      submit: "入場申請する",
      alerts: {
        selectClient: "発注者を選択してください。",
        selectPlan: "参加する工事計画を選択してください。",
        agreeTerms: "必須規約に同意してください。",
        vehicleInfo: "車両所有者を選択した場合は車両番号と車両種類を入力してください。",
        success: "入場申請が完了しました。管理者承認後、SMSでQRコードを送信いたします。",
        error: "申請中にエラーが発生しました。",
      },
    },
  }

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
    { code: "KH", name: { ko: "캄보디아", en: "Cambodia", zh: "柬埔寨", ja: "カンボジア" } },
    { code: "LK", name: { ko: "스리랑카", en: "Sri Lanka", zh: "斯里兰卡", ja: "スリランカ" } },
    { code: "OTHER", name: { ko: "기타", en: "Other", zh: "其他", ja: "その他" } },
  ]

  const vehicleTypes = {
    ko: ["승용차", "SUV", "트럭", "화물차", "승합차", "오토바이", "기타"],
    en: ["Sedan", "SUV", "Truck", "Cargo Vehicle", "Van", "Motorcycle", "Other"],
    zh: ["轿车", "SUV", "卡车", "货车", "面包车", "摩托车", "其他"],
    ja: ["乗用車", "SUV", "トラック", "貨物車", "バン", "オートバイ", "その他"],
  }

  interface ConstructionPlan {
    id: number
    title: string
    description: string
    company: string
    start_date: string
    end_date: string
    site_manager: string
    status: string
  }

  useEffect(() => {
    const savedLanguage = localStorage.getItem("safepass-language") as Language
    if (savedLanguage && ["ko", "en", "zh", "ja"].includes(savedLanguage)) {
      setLanguage(savedLanguage)
    }
    fetchConstructionPlans()
  }, [])

  const fetchConstructionPlans = async () => {
    try {
      console.log("공사계획 조회 시작...")
      setError(null)

      const response = await fetch("/api/construction-plans", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })

      console.log("Response status:", response.status)
      console.log("Response ok:", response.ok)

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()
      console.log("조회된 공사계획:", data)

      if (Array.isArray(data)) setConstructionPlans(data)
      else {
        console.error("응답 데이터가 배열이 아닙니다:", data)
        setConstructionPlans([])
      }
    } catch (error) {
      console.error("공사계획 조회 실패:", error)
      setError("공사계획을 불러오는 중 오류가 발생했습니다.")
      setConstructionPlans([])
    } finally {
      setLoading(false)
    }
  }

  const handleClientSelect = (clientValue: string) => {
    setSelectedClient(clientValue)
    setSelectedPlan("") // Reset selected plan when client changes
    setPlanDetails(null)
  }

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId)
    const selectedPlanData = constructionPlans.find((plan) => plan.id.toString() === planId)
    setPlanDetails(selectedPlanData || null)
  }

  const handleRoleChange = (role: keyof typeof roles, checked: boolean) => {
    setRoles({ ...roles, [role]: checked })
    if (role === "vehicleOwner" && !checked) {
      setFormData({ ...formData, vehicleNumber: "", vehicleType: "" })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedClient) {
      alert(texts[language].alerts.selectClient)
      return
    }
    if (!selectedPlan) {
      alert(texts[language].alerts.selectPlan)
      return
    }
    if (!agreements.service || !agreements.privacy) {
      alert(texts[language].alerts.agreeTerms)
      return
    }
    if (roles.vehicleOwner && (!formData.vehicleNumber || !formData.vehicleType)) {
      alert(texts[language].alerts.vehicleInfo)
      return
    }

    try {
      const response = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          nationality,
          roles,
          constructionPlanId: selectedPlan,
          selectedClient,
        }),
      })

      if (response.ok) {
        alert(texts[language].alerts.success)
        router.push("/")
      } else {
        const errorData = await response.json()
        alert(errorData.error || texts[language].alerts.error)
      }
    } catch (error) {
      console.error("등록 실패:", error)
      alert(texts[language].alerts.error)
    }
  }

  const isKorean = nationality === "KR"
  const filteredConstructionPlans = constructionPlans.filter((plan) => {
    if (!selectedClient) return false
    return plan.company === selectedClient
  })
  const selectedPlanData = filteredConstructionPlans.find((p) => p.id.toString() === selectedPlan)

  const getDateLocale = () => {
    switch (language) {
      case "ko":
        return "ko-KR"
      case "en":
        return "en-US"
      case "zh":
        return "zh-CN"
      case "ja":
        return "ja-JP"
      default:
        return "ko-KR"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Mobile responsive header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-2 sm:px-4 py-3 sm:py-4 flex items-center">
          <Link href="/" className="mr-2 sm:mr-4">
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
          </Link>
          <Logo size="sm" showText={true} href="/" className="mr-2 sm:mr-4" />
          <h1 className="text-base sm:text-xl font-semibold text-gray-900">{texts[language].title}</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* 제목 섹션 - Mobile responsive title section */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <User className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{texts[language].title}</h2>
          <p className="text-sm sm:text-base text-gray-600">{texts[language].subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-8">
          {/* 발주처 선택 */}
          <Card>
            <CardHeader className="bg-purple-50 p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg text-purple-900">{texts[language].clientSelection}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 sm:pt-6 space-y-4 sm:space-y-6 p-4 sm:p-6">
              <div className="space-y-2">
                <Label className="text-sm sm:text-base font-medium">{texts[language].selectClient}</Label>
                <Select value={selectedClient} onValueChange={handleClientSelect} required>
                  <SelectTrigger className="h-10 sm:h-12 bg-white border-2 border-gray-300 hover:border-purple-400 focus:border-purple-500 shadow-sm">
                    <SelectValue placeholder={texts[language].selectClientPlaceholder} />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    {["INTECO", "WIE"].map((client) => (
                      <SelectItem key={client} value={client} className="hover:bg-purple-50">
                        {client === "INTECO" ? "INTECO (인천종합에너지)" : "WIE (위드인천에너지)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 공사계획 선택 */}
          <Card>
            <CardHeader className="bg-green-50 p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg text-green-900">{texts[language].constructionPlan}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 sm:pt-6 space-y-4 sm:space-y-6 p-4 sm:p-6">
              <div className="space-y-2">
                <Label className="text-sm sm:text-base font-medium">{texts[language].selectPlan}</Label>

                {error && (
                  <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-yellow-800">{error}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={fetchConstructionPlans}
                      className="ml-auto bg-transparent text-xs"
                    >
                      {texts[language].retryButton}
                    </Button>
                  </div>
                )}

                {!selectedClient ? (
                  <div className="h-10 sm:h-12 bg-gray-100 rounded-md flex items-center justify-center px-2">
                    <span className="text-xs sm:text-sm text-gray-500 text-center">먼저 발주처를 선택해주세요</span>
                  </div>
                ) : loading ? (
                  <div className="h-10 sm:h-12 bg-gray-100 rounded-md flex items-center justify-center">
                    <span className="text-xs sm:text-sm text-gray-500">{texts[language].loadingPlans}</span>
                  </div>
                ) : filteredConstructionPlans.length > 0 ? (
                  <Select value={selectedPlan} onValueChange={handlePlanSelect} required>
                    <SelectTrigger className="h-10 sm:h-12 bg-white border-2 border-gray-300 hover:border-blue-400 focus:border-blue-500 shadow-sm">
                      <SelectValue placeholder={texts[language].selectPlanPlaceholder} />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                      {filteredConstructionPlans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id.toString()} className="hover:bg-blue-50">
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{plan.title}</span>
                            <span className="text-xs text-gray-500">
                              {plan.company} | {new Date(plan.start_date).toLocaleDateString(getDateLocale())} ~{" "}
                              {new Date(plan.end_date).toLocaleDateString(getDateLocale())}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="h-10 sm:h-12 bg-gray-100 rounded-md flex items-center justify-center px-2">
                    <span className="text-xs sm:text-sm text-gray-500 text-center">
                      {selectedClient}의 {texts[language].noPlans}
                    </span>
                  </div>
                )}

                {planDetails && (
                  <div className="mt-4 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-green-900 text-base sm:text-lg">{planDetails.title}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                        <div>
                          <span className="font-medium text-green-800">{texts[language].company}:</span>
                          <span className="ml-2 text-green-700">{planDetails.company}</span>
                        </div>
                        <div>
                          <span className="font-medium text-green-800">{texts[language].siteManager}:</span>
                          <span className="ml-2 text-green-700">{planDetails.site_manager}</span>
                        </div>
                        <div>
                          <span className="font-medium text-green-800">시작일:</span>
                          <span className="ml-2 text-green-700">
                            {new Date(planDetails.start_date).toLocaleDateString(getDateLocale())}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-green-800">종료일:</span>
                          <span className="ml-2 text-green-700">
                            {new Date(planDetails.end_date).toLocaleDateString(getDateLocale())}
                          </span>
                        </div>
                      </div>
                      {planDetails.description && (
                        <div className="mt-3 pt-3 border-t border-green-200">
                          <p className="font-medium text-green-800 mb-1 text-xs sm:text-sm">공사 내용:</p>
                          <p className="text-green-700 text-xs sm:text-sm whitespace-pre-line">
                            {planDetails.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 국적 선택 */}
          <Card>
            <CardHeader className="bg-blue-50 p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg text-blue-900">{texts[language].nationalityInfo}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 sm:pt-6 space-y-4 sm:space-y-6 p-4 sm:p-6">
              <div className="space-y-2">
                <Label className="text-sm sm:text-base font-medium">{texts[language].selectNationality}</Label>
                <Select value={nationality} onValueChange={setNationality}>
                  <SelectTrigger className="h-10 sm:h-12 bg-white border-2 border-gray-300 hover:border-blue-400 focus:border-blue-500 shadow-sm">
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

              {!isKorean && (
                <div className="space-y-2">
                  <Label htmlFor="passport" className="text-sm sm:text-base font-medium">
                    {texts[language].passportNumber}
                  </Label>
                  <Input
                    id="passport"
                    type="text"
                    value={formData.passportNumber}
                    onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value })}
                    required={!isKorean}
                    placeholder={texts[language].passportPlaceholder}
                    className="h-10 sm:h-12"
                    onFocus={(e) => {
                      if (e.target.value === "") {
                        e.target.placeholder = ""
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value === "") {
                        e.target.placeholder = texts[language].passportPlaceholder
                      }
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* 이용약관 동의 */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">{texts[language].termsAgreement}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg h-32 overflow-y-auto text-xs sm:text-sm text-gray-700">
                {texts[language].termsContent}
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="service-terms"
                    checked={agreements.service}
                    onCheckedChange={(checked) => setAgreements({ ...agreements, service: checked as boolean })}
                  />
                  <Label htmlFor="service-terms" className="text-xs sm:text-sm">
                    {texts[language].serviceTerms}
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="privacy-terms"
                    checked={agreements.privacy}
                    onCheckedChange={(checked) => setAgreements({ ...agreements, privacy: checked as boolean })}
                  />
                  <Label htmlFor="privacy-terms" className="text-xs sm:text-sm">
                    {texts[language].privacyTerms}
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 기본정보 - Mobile responsive grid */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">{texts[language].basicInfo}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm sm:text-base font-medium">
                    {texts[language].name}
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder={texts[language].namePlaceholder}
                    className="h-10 sm:h-12"
                    onFocus={(e) => {
                      if (e.target.value === "") {
                        e.target.placeholder = ""
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value === "") {
                        e.target.placeholder = texts[language].namePlaceholder
                      }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm sm:text-base font-medium">
                    {texts[language].phone}
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    placeholder={texts[language].phonePlaceholder}
                    className="h-10 sm:h-12"
                    onFocus={(e) => {
                      if (e.target.value === "") {
                        e.target.placeholder = ""
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value === "") {
                        e.target.placeholder = texts[language].phonePlaceholder
                      }
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm sm:text-base font-medium">
                    {texts[language].email}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder={texts[language].emailPlaceholder}
                    className="h-10 sm:h-12"
                    onFocus={(e) => {
                      if (e.target.value === "") {
                        e.target.placeholder = ""
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value === "") {
                        e.target.placeholder = texts[language].emailPlaceholder
                      }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="text-sm sm:text-base font-medium">
                    {texts[language].birthDate}
                  </Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    required
                    className="h-10 sm:h-12"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label className="text-sm sm:text-base font-medium">{texts[language].gender}</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  >
                    <SelectTrigger className="h-10 sm:h-12 bg-white border-2 border-gray-300 hover:border-blue-400 focus:border-blue-500 shadow-sm">
                      <SelectValue placeholder={texts[language].genderPlaceholder} />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                      <SelectItem value="male" className="hover:bg-blue-50">
                        {texts[language].male}
                      </SelectItem>
                      <SelectItem value="female" className="hover:bg-blue-50">
                        {texts[language].female}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm sm:text-base font-medium">{texts[language].bloodType}</Label>
                  <Select
                    value={formData.bloodType}
                    onValueChange={(value) => setFormData({ ...formData, bloodType: value })}
                  >
                    <SelectTrigger className="h-10 sm:h-12 bg-white border-2 border-gray-300 hover:border-blue-400 focus:border-blue-500 shadow-sm">
                      <SelectValue placeholder={texts[language].bloodTypePlaceholder} />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                      <SelectItem value="A" className="hover:bg-blue-50">
                        {texts[language].aType}
                      </SelectItem>
                      <SelectItem value="B" className="hover:bg-blue-50">
                        {texts[language].bType}
                      </SelectItem>
                      <SelectItem value="AB" className="hover:bg-blue-50">
                        {texts[language].abType}
                      </SelectItem>
                      <SelectItem value="O" className="hover:bg-blue-50">
                        {texts[language].oType}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 역할 선택 - Mobile responsive role selection */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">{texts[language].roleSelection}</CardTitle>
              <p className="text-xs sm:text-sm text-gray-600">{texts[language].roleSubtitle}</p>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="flex items-center space-x-3 p-3 sm:p-4 border rounded-lg hover:bg-gray-50">
                  <Checkbox
                    id="site-manager"
                    checked={roles.siteManager}
                    onCheckedChange={(checked) => handleRoleChange("siteManager", checked as boolean)}
                  />
                  <div>
                    <Label htmlFor="site-manager" className="text-sm sm:text-base font-medium cursor-pointer">
                      {texts[language].siteManagerRole}
                    </Label>
                    <p className="text-xs sm:text-sm text-gray-600">{texts[language].siteManagerDesc}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 sm:p-4 border rounded-lg hover:bg-gray-50">
                  <Checkbox
                    id="vehicle-owner"
                    checked={roles.vehicleOwner}
                    onCheckedChange={(checked) => handleRoleChange("vehicleOwner", checked as boolean)}
                  />
                  <div>
                    <Label htmlFor="vehicle-owner" className="text-sm sm:text-base font-medium cursor-pointer">
                      {texts[language].vehicleOwnerRole}
                    </Label>
                    <p className="text-xs sm:text-sm text-gray-600">{texts[language].vehicleOwnerDesc}</p>
                  </div>
                </div>
              </div>

              {roles.vehicleOwner && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader className="p-3 sm:p-4">
                    <CardTitle className="text-sm sm:text-base text-blue-900">{texts[language].vehicleInfo}</CardTitle>
                    <p className="text-xs sm:text-sm text-blue-700">{texts[language].vehicleInfoDesc}</p>
                  </CardHeader>
                  <CardContent className="space-y-4 p-3 sm:p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="vehicleNumber" className="text-xs sm:text-sm font-medium">
                          {texts[language].vehicleNumber}
                        </Label>
                        <Input
                          id="vehicleNumber"
                          type="text"
                          value={formData.vehicleNumber}
                          onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                          required={roles.vehicleOwner}
                          placeholder={texts[language].vehicleNumberPlaceholder}
                          className="h-9 sm:h-10"
                          onFocus={(e) => {
                            if (e.target.value === "") {
                              e.target.placeholder = ""
                            }
                          }}
                          onBlur={(e) => {
                            if (e.target.value === "") {
                              e.target.placeholder = texts[language].vehicleNumberPlaceholder
                            }
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs sm:text-sm font-medium">{texts[language].vehicleType}</Label>
                        <Select
                          value={formData.vehicleType}
                          onValueChange={(value) => setFormData({ ...formData, vehicleType: value })}
                          required={roles.vehicleOwner}
                        >
                          <SelectTrigger className="h-9 sm:h-10 bg-white border-2 border-gray-300 hover:border-blue-400 focus:border-blue-500 shadow-sm">
                            <SelectValue placeholder={texts[language].vehicleTypePlaceholder} />
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
                  </CardContent>
                </Card>
              )}

              {(roles.siteManager || roles.vehicleOwner) && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs sm:text-sm text-blue-800">
                    <strong>{texts[language].selectedRole}:</strong>{" "}
                    {[
                      roles.siteManager && texts[language].siteManagerRole,
                      roles.vehicleOwner && texts[language].vehicleOwnerRole,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  {roles.vehicleOwner && formData.vehicleNumber && formData.vehicleType && (
                    <p className="text-xs sm:text-sm text-blue-800 mt-1">
                      <strong>{texts[language].vehicleInfoSummary}:</strong> {formData.vehicleNumber} (
                      {formData.vehicleType})
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 최종 동의 */}
          <Card>
            <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
              <div className="flex items-center space-x-2">
                <Checkbox id="final-agreement" required />
                <Label htmlFor="final-agreement" className="text-xs sm:text-sm">
                  {texts[language].finalAgreement}
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* 버튼 - Mobile responsive buttons */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 pt-4 sm:pt-6">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:flex-1 h-10 sm:h-12 bg-transparent"
              onClick={() => router.push("/")}
            >
              {texts[language].previous}
            </Button>
            <Button
              type="submit"
              className="w-full sm:flex-1 h-10 sm:h-12 bg-blue-600 hover:bg-blue-700"
              disabled={!agreements.service || !agreements.privacy || !selectedClient || !selectedPlan}
            >
              {texts[language].submit}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
