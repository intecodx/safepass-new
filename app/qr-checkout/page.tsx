"use client"

import type React from "react"

import { useState } from "react"
import { QrCode, CheckCircle, XCircle, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function QRCheckoutPage() {
  const [userId, setUserId] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    user?: {
      id: number
      name: string
      phone: string
      checkout_time: string
    }
  } | null>(null)

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userId.trim()) {
      setResult({
        success: false,
        message: "사용자 ID를 입력해주세요.",
      })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch(`/api/admin/applications/${userId}/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          user: data.user,
        })
        setUserId("")
      } else {
        setResult({
          success: false,
          message: data.error || "퇴근 처리 중 오류가 발생했습니다.",
        })
      }
    } catch (error) {
      console.error("퇴근 처리 실패:", error)
      setResult({
        success: false,
        message: "퇴근 처리 중 오류가 발생했습니다.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-center space-x-2">
            <QrCode className="w-6 h-6 text-blue-600" />
            <span>QR 퇴근 처리</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleCheckout} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="userId" className="text-sm font-medium text-gray-700">
                사용자 ID (QR코드에서 스캔)
              </label>
              <Input
                id="userId"
                type="number"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="예: 123"
                className="h-12 text-center text-lg"
                disabled={loading}
                onFocus={(e) => {
                  if (e.target.value === "") {
                    e.target.placeholder = ""
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value === "") {
                    e.target.placeholder = "예: 123"
                  }
                }}
              />
            </div>

            <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? "처리 중..." : "퇴근 처리"}
            </Button>
          </form>

          {result && (
            <div
              className={`p-4 rounded-lg ${result.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
            >
              <div className="flex items-center space-x-2 mb-2">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className={`font-medium ${result.success ? "text-green-800" : "text-red-800"}`}>
                  {result.success ? "퇴근 완료" : "처리 실패"}
                </span>
              </div>

              <p className={`text-sm ${result.success ? "text-green-700" : "text-red-700"}`}>{result.message}</p>

              {result.success && result.user && (
                <div className="mt-3 p-3 bg-white rounded border">
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-gray-900">{result.user.name}</span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>연락처: {result.user.phone}</p>
                    <p>퇴근시간: {new Date(result.user.checkout_time).toLocaleString("ko-KR")}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="text-center text-sm text-gray-500">
            <p>QR코드를 스캔하여 사용자 ID를 입력하거나</p>
            <p>직접 사용자 ID를 입력해주세요</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
