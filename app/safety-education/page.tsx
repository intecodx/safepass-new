"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Building, GraduationCap } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { jsPDF } from "jspdf"

export default function SafetyEducationPage() {
  const [language, setLanguage] = useState<"ko" | "en" | "zh" | "ja">("ko")
  const [selectedSection, setSelectedSection] = useState<"main" | "inteco" | "with">("main")

  const texts = {
    ko: {
      title: "안전교육",
      subtitle: "안전한 작업환경을 위한 교육자료",
      backToHome: "홈으로 돌아가기",
      backToMain: "메인으로 돌아가기",
      intecoTitle: "인천종합에너지 안전교육",
      withTitle: "위드인천에너지 안전교육",
      facilityLayout: "사업장 평면도",
      waterTreatmentEvac: "수처리동 화재대피 안내도",
      management1FEvac: "관리동1층 화재대피 안내도",
      management2FEvac: "관리동2층 화재대피 안내도",
      management3FEvac: "관리동3층 화재대피 안내도",
      heatSourceEvac: "열원설비동 화재대피 안내도",
      fireDamageRange: "화재 피해 범위 / 비상대피소 전경",
      warehouseEvac: "창고정비동1층 화재대피 안내도",
      gasTurbineEvac: "가스터빈동 화재대피 안내도",
      districtHeatingEvac: "지역난방설비동 화재대피 안내도",
      emergencyEvacSite: "비상대피소 전경",
      steamTurbineEvac: "스팀터빈동 화재대피 안내도",
      downloadText: "텍스트 다운로드",
      downloadPdf: "PDF 다운로드",
    },
    en: {
      title: "Safety Education",
      subtitle: "Educational materials for a safe work environment",
      backToHome: "Back to Home",
      backToMain: "Back to Main",
      intecoTitle: "Incheon Integrated Energy Safety Education",
      withTitle: "With Incheon Energy Safety Education",
      facilityLayout: "Facility Layout Plan",
      waterTreatmentEvac: "Water Treatment Building Fire Evacuation Plan",
      management1FEvac: "Management Building 1st Floor Fire Evacuation Plan",
      management2FEvac: "Management Building 2nd Floor Fire Evacuation Plan",
      management3FEvac: "Management Building 3rd Floor Fire Evacuation Plan",
      heatSourceEvac: "Heat Source Equipment Building Fire Evacuation Plan",
      fireDamageRange: "Fire Damage Range / Emergency Evacuation Site Overview",
      warehouseEvac: "Warehouse Maintenance Building 1st Floor Fire Evacuation Plan",
      gasTurbineEvac: "Gas Turbine Building Fire Evacuation Plan",
      districtHeatingEvac: "District Heating Equipment Building Fire Evacuation Plan",
      emergencyEvacSite: "Emergency Evacuation Site Overview",
      steamTurbineEvac: "Steam Turbine Building Fire Evacuation Plan",
      downloadText: "Download Text",
      downloadPdf: "Download PDF",
    },
    zh: {
      title: "安全教育",
      subtitle: "为安全工作环境提供的教育材料",
      backToHome: "返回首页",
      backToMain: "返回主页",
      intecoTitle: "仁川综合能源安全教育",
      withTitle: "威德仁川能源安全教育",
      facilityLayout: "工厂平面图",
      waterTreatmentEvac: "水处理楼火灾疏散指南",
      management1FEvac: "管理楼1层火灾疏散指南",
      management2FEvac: "管理楼2层火灾疏散指南",
      management3FEvac: "管理楼3层火灾疏散指南",
      heatSourceEvac: "热源设备楼火灾疏散指南",
      fireDamageRange: "火灾损害范围 / 紧急疏散场所概览",
      warehouseEvac: "仓库维修楼1层火灾疏散指南",
      gasTurbineEvac: "燃气轮机楼火灾疏散指南",
      districtHeatingEvac: "区域供热设备楼火灾疏散指南",
      emergencyEvacSite: "紧急疏散场所概览",
      steamTurbineEvac: "蒸汽轮机楼火灾疏散指南",
      downloadText: "下载文本",
      downloadPdf: "下载PDF",
    },
    ja: {
      title: "安全教育",
      subtitle: "安全な作業環境のための教育資料",
      backToHome: "ホームに戻る",
      backToMain: "メインに戻る",
      intecoTitle: "仁川総合エネルギー安全教育",
      withTitle: "ウィズ仁川エネルギー安全教育",
      facilityLayout: "事業場平面図",
      waterTreatmentEvac: "水処理棟火災避難案内図",
      management1FEvac: "管理棟1階火災避難案内図",
      management2FEvac: "管理棟2階火災避難案内図",
      management3FEvac: "管理棟3階火災避難案内図",
      heatSourceEvac: "熱源設備棟火災避難案内図",
      fireDamageRange: "火災被害範囲 / 非常避難所全景",
      warehouseEvac: "倉庫整備棟1階火災避難案内図",
      gasTurbineEvac: "ガスタービン棟火災避難案内図",
      districtHeatingEvac: "地域暖房設備棟火災避難案内図",
      emergencyEvacSite: "非常避難所全景",
      steamTurbineEvac: "スチームタービン棟火災避難案内図",
      downloadText: "テキストダウンロード",
      downloadPdf: "PDFダウンロード",
    },
  }

  const safetyContent = {
    ko: {
      facilityItems: [
        "가압장",
        "축열조",
        "터빈발전기실",
        "DH 펌프실",
        "PLB주보일러실",
        "DH COOLER",
        "정압기실",
        "SWITCH YARD",
        "전기실",
        "창고정비동",
        "경비실",
        "정문",
        "구내속도: 10km/h",
        "열원설비동",
        "수처리동",
        "관리동",
        "수영장",
      ],
      evacuationInfo: {
        general: "대피장소: 경비실 앞 외부 주차장",
        route: "대피로: 현위치 → 1차 이동경로 → 2차 이동경로",
        equipment: "소화설비: A,B,C분말소화기, CO2소화기, 자동확산소화기, 옥내소화전",
      },
      fireRange: "화재시 피해범위: 누출원으로부터 반경 34m",
    },
    en: {
      facilityItems: [
        "Pressurization Station",
        "Heat Storage Tank",
        "Turbine Generator Room",
        "DH Pump Room",
        "PLB Main Boiler Room",
        "DH COOLER",
        "Pressure Regulator Room",
        "SWITCH YARD",
        "Electrical Room",
        "Warehouse Maintenance Building",
        "Security Office",
        "Main Gate",
        "Internal Speed Limit: 10km/h",
        "Heat Source Equipment Building",
        "Water Treatment Building",
        "Management Building",
        "Swimming Pool",
      ],
      evacuationInfo: {
        general: "Evacuation Site: External parking lot in front of security office",
        route: "Evacuation Route: Current Position → Primary Route → Secondary Route",
        equipment:
          "Fire Equipment: A,B,C Powder Extinguisher, CO2 Extinguisher, Automatic Diffusion Extinguisher, Indoor Fire Hydrant",
      },
      fireRange: "Fire Damage Range: 34m radius from leak source",
    },
    zh: {
      facilityItems: [
        "加压站",
        "蓄热槽",
        "汽轮发电机室",
        "DH泵房",
        "PLB主锅炉房",
        "DH冷却器",
        "调压器室",
        "开关站",
        "电气室",
        "仓库维修楼",
        "警卫室",
        "正门",
        "厂内限速：10km/h",
        "热源设备楼",
        "水处理楼",
        "管理楼",
        "游泳池",
      ],
      evacuationInfo: {
        general: "疏散地点：警卫室前外部停车场",
        route: "疏散路线：当前位置 → 一次疏散路线 → 二次疏散路线",
        equipment: "消防设备：A,B,C粉末灭火器、CO2灭火器、自动扩散灭火器、室内消火栓",
      },
      fireRange: "火灾损害范围：泄漏源半径34米",
    },
    ja: {
      facilityItems: [
        "加圧場",
        "蓄熱槽",
        "タービン発電機室",
        "DHポンプ室",
        "PLB主ボイラー室",
        "DHクーラー",
        "調圧器室",
        "スイッチヤード",
        "電気室",
        "倉庫整備棟",
        "警備室",
        "正門",
        "構内速度：10km/h",
        "熱源設備棟",
        "水処理棟",
        "管理棟",
        "プール",
      ],
      evacuationInfo: {
        general: "避難場所：警備室前外部駐車場",
        route: "避難経路：現在位置 → 1次移動経路 → 2次移動経路",
        equipment: "消火設備：A,B,C粉末消火器、CO2消火器、自動拡散消火器、屋内消火栓",
      },
      fireRange: "火災被害範囲：漏洩源から半径34m",
    },
  }

  const handleIntecoClick = () => {
    setSelectedSection("inteco")
  }

  const handleWithClick = () => {
    setSelectedSection("with")
  }

  const handleBackToMain = () => {
    setSelectedSection("main")
  }

  const downloadSafetyMaterials = () => {
    const currentContent = safetyContent[language]
    const currentTexts = texts[language]

    const content = `${currentTexts.withTitle}

=== ${currentTexts.facilityLayout} ===
${currentContent.facilityItems.join("\n- ")}

=== ${currentTexts.management1FEvac} ===
${currentContent.evacuationInfo.general}
${currentContent.evacuationInfo.route}

=== ${currentTexts.management2FEvac} ===
${currentContent.evacuationInfo.general}
${currentContent.evacuationInfo.route}

=== ${currentTexts.management3FEvac} ===
${currentContent.evacuationInfo.general}
${currentContent.evacuationInfo.route}

=== ${currentTexts.heatSourceEvac} ===
${currentContent.evacuationInfo.equipment}
${currentContent.evacuationInfo.general}

=== ${currentTexts.waterTreatmentEvac} ===
${currentContent.evacuationInfo.equipment}
${currentContent.evacuationInfo.general}

=== ${currentTexts.fireDamageRange} ===
${currentContent.evacuationInfo.general}
${currentContent.fireRange}`

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${currentTexts.withTitle.replace(/\s+/g, "_")}_안전교육자료.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadPDF = async () => {
    const doc = new jsPDF()

    doc.setFont("helvetica")
    doc.setFontSize(16)

    const currentContent = safetyContent[language]
    const currentTexts = texts[language]

    if (selectedSection === "inteco") {
      doc.text(currentTexts.intecoTitle, 20, 20)

      let yPosition = 40

      doc.setFontSize(14)
      doc.text("안전보건교육자료 - 2025년 배포용", 20, yPosition)
      yPosition += 15

      doc.setFontSize(12)
      doc.text("목차", 20, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      const tableOfContents = [
        "I. 안전교육 & 안전관리계획",
        "II. 사업장 작업환경 측정결과",
        "III. 물질안전보건자료(MSDS)",
      ]

      tableOfContents.forEach((item) => {
        if (yPosition > 270) {
          doc.addPage()
          yPosition = 20
        }
        doc.text(item, 25, yPosition)
        yPosition += 7
      })

      yPosition += 15

      doc.setFontSize(14)
      doc.text("사업장 평면도", 20, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      const facilityItems = [
        "구내속도 20km/h",
        "공사구역",
        "주차구역",
        "보행자 유의구간",
        "1차 대피소 - 셀트리온 방향",
        "도로녹지",
        "비상대피로",
      ]

      facilityItems.forEach((item) => {
        if (yPosition > 270) {
          doc.addPage()
          yPosition = 20
        }
        doc.text(`- ${item}`, 25, yPosition)
        yPosition += 7
      })

      yPosition += 15

      doc.setFontSize(14)
      doc.text("화재대피 안내도", 20, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      const evacuationPlans = [
        "관리동1층 화재대피 안내도",
        "- 대피로: 현위치 → 이동경로",
        "- 대피장소: 테라스",
        "- 소화기: 이산화탄소소화기(CO2), 분말소화기(ABC)",
        "",
        "가스터빈동 화재대피 안내도",
        "- 가스터빈발전기, HRSG, OIL/GAS MODULE",
        "- 분말소화기(ABC), 공기호흡기",
        "- 세안장치 설치",
        "",
        "스팀터빈동 화재대피 안내도",
        "- DH Heater, Vacuum Pump",
        "- 지하PIT 상층부",
        "- 분말소화기(ABC)",
        "",
        "지역난방설비동 화재대피 안내도",
        "- 비상발전기실, 공기압축기실",
        "- 첨두부하보일러",
        "- 분말소화기(ABC), 이산화탄소소화기(CO2)",
        "",
        "창고정비동1층 화재대피 안내도",
        "- 기계공작실, 장비실, 공구실",
        "- 부속창고, 소형창고",
        "- 분말소화기(ABC), 이산화탄소소화기(CO2)",
      ]

      evacuationPlans.forEach((item) => {
        if (yPosition > 270) {
          doc.addPage()
          yPosition = 20
        }
        doc.text(item, 25, yPosition)
        yPosition += 7
      })

      yPosition += 15

      doc.setFontSize(14)
      doc.text("안전보건조직도", 20, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      const safetyOrg = [
        "자위소방대 조직도",
        "- 대장: CSO(안전보건관리책임자)",
        "- 소방지휘본부: 기술본부장",
        "- 상황통제본부: 관리본부장",
        "- 의료구호본부: 사업본부장",
        "",
        "반별 임무:",
        "- 지휘반: 안전환경팀",
        "- 훈련및소화반: 기계팀, 운영팀",
        "- 피난유도반: 계전팀, 네트워크팀",
        "- 비상연락반: 경영지원팀",
        "- 경계반: 기획재무팀, DX추진팀",
        "- 의료반: ESG추진팀",
        "- 후송반: 대외협력팀",
        "- 방호및복구반: 고객지원팀",
      ]

      safetyOrg.forEach((item) => {
        if (yPosition > 270) {
          doc.addPage()
          yPosition = 20
        }
        doc.text(item, 25, yPosition)
        yPosition += 7
      })

      yPosition += 15

      doc.setFontSize(14)
      doc.text("비상대응 절차", 20, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      const emergencyProcedures = [
        "천연가스 누출시:",
        "- 천연가스 공급밸브 차단",
        "- 차단불가시 비상정지",
        "- 비상조직 운영",
        "- 관련기관 신고",
        "",
        "화재발생시:",
        "- 가연물 차단",
        "- 화재지역 격리",
        "- 초기 진압",
        "- 진압불가시 비상정지",
        "",
        "화학물질 누출시:",
        "- 누출 차단",
        "- 누출지역 격리",
        "- 중화작업",
        "- 조치불가시 비상정지",
        "",
        "비상연락처:",
        "- 교대근무 운영리더: 032-850-6218",
        "- 안전관리자: 010-8715-5792",
      ]

      emergencyProcedures.forEach((item) => {
        if (yPosition > 270) {
          doc.addPage()
          yPosition = 20
        }
        doc.text(item, 25, yPosition)
        yPosition += 7
      })

      yPosition += 15

      doc.setFontSize(14)
      doc.text("화학물질 사용현황", 20, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      const chemicals = [
        "주요 화학물질:",
        "- SBS(중아황산소다)",
        "- 수산화나트륨(4%)",
        "- 염산(9%)",
        "- 황산알루미늄",
        "- 경유",
        "- NG(천연가스)",
        "- 변압기 절연유",
        "- SF6",
        "- 아세틸렌",
        "- 액화석유가스(LPG)",
        "- 산소, 질소, 이산화탄소",
        "- 아르곤",
        "- 각종 윤활유",
      ]

      chemicals.forEach((item) => {
        if (yPosition > 270) {
          doc.addPage()
          yPosition = 20
        }
        doc.text(item, 25, yPosition)
        yPosition += 7
      })

      yPosition += 15

      doc.setFontSize(14)
      doc.text("안전설비 위치", 20, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      const safetyEquipment = [
        "보호구함 위치:",
        "- 주제어동 1F",
        "- 창고동 1F",
        "",
        "세정장치 위치:",
        "- 세안장치 3개소 설치",
        "",
        "흡연구역:",
        "- 관리동 지하",
        "- 지정된 흡연실에서만 흡연",
        "",
        "폭발위험장소:",
        "- 별도 표시된 구역",
        "- 출입 시 주의사항 준수",
      ]

      safetyEquipment.forEach((item) => {
        if (yPosition > 270) {
          doc.addPage()
          yPosition = 20
        }
        doc.text(item, 25, yPosition)
        yPosition += 7
      })

      doc.save(`${currentTexts.intecoTitle.replace(/\s+/g, "_")}_안전교육자료.pdf`)
    } else {
      doc.text(currentTexts.withTitle, 20, 20)

      let yPosition = 40

      doc.setFontSize(14)
      doc.text(currentTexts.facilityLayout, 20, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      currentContent.facilityItems.forEach((item, index) => {
        if (yPosition > 270) {
          doc.addPage()
          yPosition = 20
        }
        doc.text(`- ${item}`, 25, yPosition)
        yPosition += 7
      })

      yPosition += 10
      doc.setFontSize(14)
      doc.text("Emergency Evacuation Information", 20, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      doc.text(currentContent.evacuationInfo.general, 25, yPosition)
      yPosition += 7
      doc.text(currentContent.evacuationInfo.route, 25, yPosition)
      yPosition += 7
      doc.text(currentContent.evacuationInfo.equipment, 25, yPosition)
      yPosition += 7
      doc.text(currentContent.fireRange, 25, yPosition)

      doc.save(`${currentTexts.withTitle.replace(/\s+/g, "_")}_Safety_Education.pdf`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/">
              <Button variant="ghost" className="flex items-center space-x-2">
                <ArrowLeft className="w-4 h-4" />
                <span>{texts[language].backToHome}</span>
              </Button>
            </Link>

            <div className="flex space-x-2">
              <Button variant={language === "ko" ? "default" : "outline"} size="sm" onClick={() => setLanguage("ko")}>
                한국어
              </Button>
              <Button variant={language === "en" ? "default" : "outline"} size="sm" onClick={() => setLanguage("en")}>
                EN
              </Button>
              <Button variant={language === "zh" ? "default" : "outline"} size="sm" onClick={() => setLanguage("zh")}>
                中文
              </Button>
              <Button variant={language === "ja" ? "default" : "outline"} size="sm" onClick={() => setLanguage("ja")}>
                日本語
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{texts[language].title}</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">{texts[language].subtitle}</p>
        </div>

        {selectedSection === "main" && (
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* INTECO Section */}
            <Card
              className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={handleIntecoClick}
            >
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-blue-900 mb-4">{texts[language].intecoTitle}</CardTitle>
                <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building className="w-10 h-10 text-white" />
                </div>
              </CardHeader>
            </Card>

            {/* WITH Section */}
            <Card
              className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={handleWithClick}
            >
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-green-900 mb-4">{texts[language].withTitle}</CardTitle>
                <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="w-10 h-10 text-white" />
                </div>
              </CardHeader>
            </Card>
          </div>
        )}

        {selectedSection === "inteco" && (
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-blue-900">{texts[language].intecoTitle}</h2>
              <Button
                onClick={handleBackToMain}
                variant="outline"
                className="flex items-center space-x-2 bg-transparent"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{texts[language].backToMain}</span>
              </Button>
            </div>

            <div className="space-y-8">
              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-blue-900">{texts[language].facilityLayout}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src="/inteco-facility-layout.png"
                        alt="인천종합에너지 사업장 평면도"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-blue-900">{texts[language].warehouseEvac}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-zF7NaZjnhpDVHYKZweTsKPWQM4z64q.png"
                      alt="창고정비동1층 화재대피 안내도"
                      fill
                      className="object-contain"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-blue-900">{texts[language].gasTurbineEvac}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-laScGHSmHXO9pknFLmcYbUlvpB9gGy.png"
                      alt="가스터빈동 화재대피 안내도"
                      fill
                      className="object-contain"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-blue-900">
                    {texts[language].districtHeatingEvac}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-mI0naJQ5gz2JmLiwjwrimU1bIzTPaz.png"
                      alt="지역난방설비동 화재대피 안내도"
                      fill
                      className="object-contain"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-blue-900">
                    {texts[language].emergencyEvacSite}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-DlnNHLvMuUiFigkcPAE4sL71DfI7yf.png"
                      alt="비상대피소 전경"
                      fill
                      className="object-contain"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-blue-900">{texts[language].management1FEvac}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-F9I9TM8oAI4D7kSqhrhbCTB1iw08XS.png"
                      alt="관리동1층 화재대피 안내도"
                      fill
                      className="object-contain"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-blue-900">{texts[language].steamTurbineEvac}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-goAjvumFSG1VSgjtkXEwVT0mXnpDP4.png"
                      alt="스팀터빈동 화재대피 안내도"
                      fill
                      className="object-contain"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {selectedSection === "with" && (
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-green-900">{texts[language].withTitle}</h2>
              <Button
                onClick={handleBackToMain}
                variant="outline"
                className="flex items-center space-x-2 bg-transparent"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{texts[language].backToMain}</span>
              </Button>
            </div>

            <div className="space-y-8">
              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-green-900">{texts[language].facilityLayout}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src="/with-facility-layout.png"
                        alt="위드인천에너지 사업장 평면도"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-green-900">
                    {texts[language].waterTreatmentEvac}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-qva1RLvtiNifkMbsZdpKBcItjVKSmF.png"
                      alt="수처리동 화재대피 안내도"
                      fill
                      className="object-contain"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-green-900">
                    {texts[language].management1FEvac}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-uKIbItxj64yu4dIGcJ2NIcEulaevgv.png"
                      alt="관리동1층 화재대피 안내도"
                      fill
                      className="object-contain"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-green-900">
                    {texts[language].management2FEvac}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-5bLlOUcyf98zmIcejpOArAGqsoOoiL.png"
                      alt="관리동2층 화재대피 안내도"
                      fill
                      className="object-contain"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-green-900">
                    {texts[language].management3FEvac}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-3wUiyJByb4bIA8rjxZSiLfNFYCpAnq.png"
                      alt="관리동3층 화재대피 안내도"
                      fill
                      className="object-contain"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-green-900">{texts[language].heatSourceEvac}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-wXcyN2FFO1vXsFm4zrYNnHFmwYO0Ke.png"
                      alt="열원설비동 화재대피 안내도"
                      fill
                      className="object-contain"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-green-900">{texts[language].fireDamageRange}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-hSyApdilnZ3OB3rdFMoJLSzhAhzEFX.png"
                      alt="화재 피해 범위 / 비상대피소 전경"
                      fill
                      className="object-contain"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
