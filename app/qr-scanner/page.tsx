"use client"

import { useState, useEffect } from "react"
import { QrCode, CheckCircle, XCircle, User, Clock } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface CheckoutResult {
  success: boolean
  message: string
  user?: {
    id: number
    name: string
    phone: string
    checkout_time: string
  }
}

export default function QRScannerPage() {
  const [result, setResult] = useState<CheckoutResult | null>(null)
  const [recentCheckouts, setRecentCheckouts] = useState<CheckoutResult[]>([])

  // 실제 QR 스캐너 대신 시뮬레이션용 버튼들
  const simulateQRScan = async (userId: number) => {
    try {
      const response = await fetch(`/api/admin/applications/${userId}/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      const newResult: CheckoutResult = {
        success: response.ok,
        message: data.message,
        user: data.user,
      }

      setResult(newResult)

      if (newResult.success) {
        setRecentCheckouts(prev => [newResult, ...prev.slice(0, 4)])
      }
    } catch (error) {
      console.error("퇴근 처리 실패:", error)
      setResult({
        success: false,
        message: "퇴근 처리 중 오류가 발생했습니다.",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 헤더 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-center space-x-2">
              <QrCode className="w-6 h-6 text-blue-600" />
              <span>QR 퇴근 스캐너</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">근로자의 QR코드를 스캔하여 퇴근 처리를 진행합니다</p>
            
            {/* 시뮬레이션용 버튼들 */}
            <div className="space-y-2 mb-6">
              <p className="text-sm text-gray-500">테스트용 QR 스캔 시뮬레이션:</p>
              <div className="flex justify-center space-x-2">
                <Button onClick={() => simulateQRScan(2)} size="sm" variant="outline">
                  사용자 2 스캔
                </Button>
                <Button onClick={() => simulateQRScan(3)} size="sm" variant="outline">
                  사용자 3 스캔
                </Button>
                <Button onClick={() => simulateQRScan(5)} size="sm" variant="outline">
                  사용자 5 스캔
                </Button>
              </div>
            </div>

            {/* 스캔 결과 */}
            {result && (
              <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center justify-center space-x-2 mb-2">
                  {result.success ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600" />
                  )}
                  <span className={`font-medium text-lg ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                    {result.success ? "퇴근 완료!" : "처리 실패"}
                  </span>
                </div>
                
                <p className={`text-sm mb-3 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                  {result.message}
                </p>

                {result.success && result.user && (
                  <div className="bg-white rounded-lg p-4 border">
                    <div className="flex items-center justify-center space-x-2 mb-3">
                      <User className="w-5 h-5 text-gray-600" />
                      <span className="font-semibold text-gray-900 text-lg">{result.user.name}</span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center justify-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>퇴근시간: {new Date(result.user.checkout_time).toLocaleString("ko-KR")}</span>
                      </div>
                      <p>연락처: {result.user.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 최근 퇴근 기록 */}
        {recentCheckouts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>최근 퇴근 기록</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentCheckouts.map((checkout, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="font-medium text-gray-900">{checkout.user?.name}</div>
                        <div className="text-sm text-gray-600">{checkout.user?.phone}</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {checkout.user && new Date(checkout.user.checkout_time).toLocaleTimeString("ko-KR")}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 사용 안내 */}
        <Card>
          <CardHeader>
            <CardTitle>사용 안내</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• 근로자가 퇴근 시 QR코드를 스캔하면 자동으로 퇴근 처리됩니다</p>
              <p>• 관리자의 별도 승인 없이 즉시 "퇴근완료" 상태로 변경됩니다</p>
              <p>• 퇴근 기록은 관리자 페이지에서 확인할 수 있습니다</p>
              <p>• 퇴근 시간은 자동으로 기록되어 출입 로그에 저장됩니다</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
