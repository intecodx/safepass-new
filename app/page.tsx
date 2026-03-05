"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { User, GraduationCap, Search, ArrowRight, Globe } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"

type Language = "ko" | "en" | "zh" | "ja"

export default function HomePage() {
  const [language, setLanguage] = useState<Language>("ko")

  const texts = {
    ko: {
      title: "Safepass System",
      subtitle: "INTECO & WIE 안전출입 관리시스템",
      adminLogin: "관리자 로그인",
      accessApplication: {
        title: "출입 신청",
        subtitle: "Visitor Registration",
        description: "새로운 출입 신청을 등록하세요",
      },
      statusInquiry: {
        title: "조회 및 변경",
        subtitle: "Status Inquiry & Modification",
        description: "신청 현황을 확인하고 정보를 수정하세요",
      },
      safetyEducation: {
        title: "안전교육",
        subtitle: "Safety Education",
        description: "안전교육 자료를 확인하세요",
      },
      footer: {
        monitoring: "실시간 모니터링",
        qrAuth: "QR코드 인증",
        safetyRequired: "안전교육 필수",
        copyright: "© 2024 INTECO & WIE. All rights reserved.",
        safetyFirst: "24시간 안전 관리",
        safetyMessage: "INTECO & WIE는 모든 출입자의 안전을 최우선으로 생각합니다.",
        commitment: "안전한 작업환경 조성을 위해 최선을 다하겠습니다.",
      },
    },
    en: {
      title: "Safepass System",
      subtitle: "INTECO & WIE Safety Access Management System",
      adminLogin: "Admin Login",
      accessApplication: {
        title: "Access Application",
        subtitle: "Visitor Registration",
        description: "Register a new access application",
      },
      statusInquiry: {
        title: "Status Inquiry & Modification",
        subtitle: "Check & Update Status",
        description: "Check application status and modify information",
      },
      safetyEducation: {
        title: "Safety Education",
        subtitle: "Safety Training Materials",
        description: "Check safety education materials",
      },
      footer: {
        monitoring: "Real-time Monitoring",
        qrAuth: "QR Code Authentication",
        safetyRequired: "Safety Education Required",
        copyright: "© 2024 INTECO & WIE. All rights reserved.",
        safetyFirst: "24/7 Safety Management",
        safetyMessage: "INTECO & WIE prioritizes the safety of all visitors.",
        commitment: "We are committed to creating a safe working environment.",
      },
    },
    zh: {
      title: "Safepass System",
      subtitle: "INTECO & WIE 安全出入管理系统",
      adminLogin: "管理员登录",
      accessApplication: {
        title: "出入申请",
        subtitle: "访客登记",
        description: "注册新的出入申请",
      },
      statusInquiry: {
        title: "查询及变更",
        subtitle: "状态查询和修改",
        description: "查看申请状态并修改信息",
      },
      safetyEducation: {
        title: "安全教育",
        subtitle: "安全培训",
        description: "查看安全教育资料",
      },
      footer: {
        monitoring: "实时监控",
        qrAuth: "二维码认证",
        safetyRequired: "安全教育必修",
        copyright: "© 2024 INTECO & WIE. 保留所有权利。",
        safetyFirst: "24小时安全管理",
        safetyMessage: "INTECO & WIE 将所有出入人员的安全放在首位。",
        commitment: "我们致力于创造安全的工作环境。",
      },
    },
    ja: {
      title: "Safepass System",
      subtitle: "INTECO & WIE 安全入場管理システム",
      adminLogin: "管理者ログイン",
      accessApplication: {
        title: "入場申請",
        subtitle: "来訪者登録",
        description: "新しい入場申請を登録してください",
      },
      statusInquiry: {
        title: "照会及び変更",
        subtitle: "ステータス照会・修正",
        description: "申請状況を確認し、情報を修正してください",
      },
      safetyEducation: {
        title: "安全教育",
        subtitle: "セーフティトレーニング",
        description: "安全教育資料を確認してください",
      },
      footer: {
        monitoring: "リアルタイム監視",
        qrAuth: "QRコード認証",
        safetyRequired: "安全教育必須",
        copyright: "© 2024 INTECO & WIE. 無断転載を禁じます。",
        safetyFirst: "24時間安全管理",
        safetyMessage: "INTECO & WIEは全ての入場者の安全を最優先に考えます。",
        commitment: "安全な作業環境の構築に最善を尽くします。",
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

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage)
    localStorage.setItem("safepass-language", newLanguage)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Logo size="md" showText={true} href="/" />
            </div>

            <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-4">
              {/* 언어 선택 */}
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                <div className="flex space-x-0.5 sm:space-x-1 bg-gray-100 rounded-lg p-0.5 sm:p-1">
                  <Button
                    variant={language === "ko" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleLanguageChange("ko")}
                    className={`h-6 sm:h-7 px-1.5 sm:px-2 text-[10px] sm:text-xs transition-all ${
                      language === "ko"
                        ? "bg-white shadow-sm text-blue-600 font-medium"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    한국어
                  </Button>
                  <Button
                    variant={language === "en" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleLanguageChange("en")}
                    className={`h-6 sm:h-7 px-1.5 sm:px-2 text-[10px] sm:text-xs transition-all ${
                      language === "en"
                        ? "bg-white shadow-sm text-blue-600 font-medium"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    EN
                  </Button>
                  <Button
                    variant={language === "zh" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleLanguageChange("zh")}
                    className={`h-6 sm:h-7 px-1.5 sm:px-2 text-[10px] sm:text-xs transition-all ${
                      language === "zh"
                        ? "bg-white shadow-sm text-blue-600 font-medium"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    中文
                  </Button>
                  <Button
                    variant={language === "ja" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleLanguageChange("ja")}
                    className={`h-6 sm:h-7 px-1.5 sm:px-2 text-[10px] sm:text-xs transition-all ${
                      language === "ja"
                        ? "bg-white shadow-sm text-blue-600 font-medium"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    日本語
                  </Button>
                </div>
              </div>

              {/* 관리자 로그인 */}
              <Link
                href="/admin/login"
                className="text-[10px] sm:text-sm text-gray-600 hover:text-gray-800 border border-gray-300 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                {texts[language].adminLogin}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-3 sm:px-4 py-8 sm:py-16">
        <div className="text-center mb-8 sm:mb-16">
          <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            {texts[language].title}
          </h1>
          <p className="text-base sm:text-xl text-gray-600 mb-3 sm:mb-4 px-2">{texts[language].subtitle}</p>
          <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-blue-500 to-green-500 mx-auto rounded-full"></div>
        </div>

        <div className="space-y-4 sm:space-y-8">
          <Link href="/registration" className="block group">
            <Card className="hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-blue-200 transform hover:-translate-y-1 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200">
              <CardContent className="p-4 sm:p-8">
                <div className="flex items-center justify-between gap-3 sm:gap-0">
                  <div className="flex items-center space-x-3 sm:space-x-6 flex-1 min-w-0">
                    <div className="w-14 h-14 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-xl transition-shadow">
                      <User className="w-7 h-7 sm:w-10 sm:h-10 text-white" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2 group-hover:text-blue-700 transition-colors">
                        {texts[language].accessApplication.title}
                      </h2>
                      <p className="text-sm sm:text-lg text-gray-600 hidden sm:block">
                        {texts[language].accessApplication.subtitle}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 line-clamp-2">
                        {texts[language].accessApplication.description}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/status" className="block group">
            <Card className="hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-green-200 transform hover:-translate-y-1 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200">
              <CardContent className="p-4 sm:p-8">
                <div className="flex items-center justify-between gap-3 sm:gap-0">
                  <div className="flex items-center space-x-3 sm:space-x-6 flex-1 min-w-0">
                    <div className="w-14 h-14 sm:w-20 sm:h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-xl transition-shadow">
                      <Search className="w-7 h-7 sm:w-10 sm:h-10 text-white" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2 group-hover:text-green-700 transition-colors">
                        {texts[language].statusInquiry.title}
                      </h2>
                      <p className="text-sm sm:text-lg text-gray-600 hidden sm:block">
                        {texts[language].statusInquiry.subtitle}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 line-clamp-2">
                        {texts[language].statusInquiry.description}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 group-hover:text-green-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/safety-education" className="block group">
            <Card className="hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-red-200 transform hover:-translate-y-1 bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200">
              <CardContent className="p-4 sm:p-8">
                <div className="flex items-center justify-between gap-3 sm:gap-0">
                  <div className="flex items-center space-x-3 sm:space-x-6 flex-1 min-w-0">
                    <div className="w-14 h-14 sm:w-20 sm:h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-xl transition-shadow">
                      <GraduationCap className="w-7 h-7 sm:w-10 sm:h-10 text-white" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2 group-hover:text-red-700 transition-colors">
                        {texts[language].safetyEducation.title}
                      </h2>
                      <p className="text-sm sm:text-lg text-gray-600 hidden sm:block">
                        {texts[language].safetyEducation.subtitle}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 line-clamp-2">
                        {texts[language].safetyEducation.description}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 group-hover:text-red-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* 추가 정보 섹션 */}
        <div className="mt-12 sm:mt-20 text-center">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-lg border border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
              {texts[language].footer.safetyFirst}
            </h3>
            <p className="text-xs sm:text-base text-gray-600 mb-4 sm:mb-6 px-2">
              {texts[language].footer.safetyMessage}
              <br />
              {texts[language].footer.commitment}
            </p>
            {/* 기능 배지 */}
            <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-8 text-[10px] sm:text-sm text-gray-500">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="whitespace-nowrap">{texts[language].footer.monitoring}</span>
              </div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                <span className="whitespace-nowrap">{texts[language].footer.qrAuth}</span>
              </div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                <span className="whitespace-nowrap">{texts[language].footer.safetyRequired}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 sm:mt-12">
          <p className="text-xs sm:text-sm text-gray-500 px-2">{texts[language].footer.copyright}</p>

          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
            <Link href="/sms-test">
              <Button variant="outline" size="sm" className="text-[10px] sm:text-xs bg-transparent h-8 sm:h-auto">
                📱 SMS API 테스트 도구
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
