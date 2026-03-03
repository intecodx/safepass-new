"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { QrCode, Camera, CheckCircle, XCircle, User, Phone, Building, LogOut } from "lucide-react"
import { BrowserQRCodeReader } from "@zxing/library"

interface ScanResult {
  success: boolean
  user?: {
    id: number
    name: string
    phone: string
    status: string
    construction_plan?: {
      title: string
      company: string
    }
  }
  error?: string
  checkoutSuccess?: boolean
  checkoutMessage?: string
}

export default function QRScannerPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [qrReader, setQrReader] = useState<BrowserQRCodeReader | null>(null)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsScanning(true)
        startQRScanning()
      }
    } catch (error) {
      console.error("카메라 접근 실패:", error)
      alert("카메라에 접근할 수 없습니다.")
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    if (qrReader) {
      qrReader.reset()
    }
    setIsScanning(false)
  }

  const startQRScanning = async () => {
    try {
      const reader = new BrowserQRCodeReader()
      setQrReader(reader)

      const videoInputDevices = await BrowserQRCodeReader.listVideoInputDevices()
      const selectedDeviceId = videoInputDevices[0]?.deviceId

      if (selectedDeviceId && videoRef.current) {
        reader.decodeFromVideoDevice(selectedDeviceId, videoRef.current, (result, error) => {
          if (result) {
            console.log("QR코드 스캔 성공:", result.getText())
            verifyQRCode(result.getText())
            stopCamera()
          }
          if (error && !(error.name === "NotFoundException")) {
            console.error("QR코드 스캔 오류:", error)
          }
        })
      }
    } catch (error) {
      console.error("QR코드 스캔 초기화 실패:", error)
    }
  }

  const processCheckout = async (userId: number) => {
    setIsProcessingCheckout(true)
    try {
      const response = await fetch(`/api/admin/applications/${userId}/complete`, {
        method: "POST",
      })
      const data = await response.json()

      return {
        success: data.success,
        message: data.message || data.error,
      }
    } catch (error) {
      return {
        success: false,
        message: "퇴근 처리 중 오류가 발생했습니다.",
      }
    } finally {
      setIsProcessingCheckout(false)
    }
  }

  const verifyQRCode = async (url: string) => {
    try {
      const urlMatch = url.match(/\/verify\/(\d+)\?token=(.+)/)
      if (!urlMatch) {
        setScanResult({ success: false, error: "유효하지 않은 QR코드 형식입니다." })
        return
      }

      const [, id, token] = urlMatch
      const response = await fetch(`/api/verify/${id}?token=${token}`)
      const data = await response.json()

      if (data.success && data.user) {
        const checkoutResult = await processCheckout(data.user.id)
        setScanResult({
          ...data,
          checkoutSuccess: checkoutResult.success,
          checkoutMessage: checkoutResult.message,
        })
      } else {
        setScanResult(data)
      }
    } catch (error) {
      setScanResult({ success: false, error: "QR코드 검증 중 오류가 발생했습니다." })
    }
  }

  const handleManualTest = () => {
    alert("카메라를 QR코드에 가까이 대면 자동으로 스캔됩니다.")
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">QR코드 스캐너</h1>
        <p className="text-gray-600">근로자의 QR코드를 스캔하여 자동으로 퇴근 처리하세요</p>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* 카메라 스캔 섹션 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              카메라 스캔
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: "4/3" }}>
              {isScanning ? (
                <>
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg flex items-center justify-center">
                      <p className="text-white text-sm font-medium bg-black bg-opacity-50 px-2 py-1 rounded">
                        QR코드를 여기에 맞춰주세요
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">카메라를 시작하여 QR코드를 스캔하세요</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {!isScanning ? (
                <Button onClick={startCamera} className="flex-1">
                  <Camera className="w-4 h-4 mr-2" />
                  카메라 시작
                </Button>
              ) : (
                <>
                  <Button onClick={stopCamera} variant="outline" className="flex-1 bg-transparent">
                    카메라 중지
                  </Button>
                  <Button
                    onClick={handleManualTest}
                    variant="outline"
                    className="flex-1 bg-transparent"
                    disabled={isProcessingCheckout}
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    스캔 안내
                  </Button>
                </>
              )}
            </div>

            {isScanning && (
              <Alert className="border-blue-500 bg-blue-50">
                <Camera className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-blue-700">
                  QR코드를 카메라에 가까이 대면 자동으로 스캔됩니다. 스캔이 완료되면 자동으로 퇴근 처리됩니다.
                </AlertDescription>
              </Alert>
            )}

            <canvas ref={canvasRef} className="hidden" />
          </CardContent>
        </Card>
      </div>

      {scanResult && (
        <Card className={scanResult.success ? "border-green-500" : "border-red-500"}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${scanResult.success ? "text-green-700" : "text-red-700"}`}>
              {scanResult.success ? (
                <>
                  <CheckCircle className="w-6 h-6" />
                  {scanResult.checkoutSuccess ? "퇴근 처리 완료" : "출입 승인 확인"}
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6" />
                  검증 실패
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scanResult.success && scanResult.user ? (
              <div className="space-y-4">
                {scanResult.checkoutSuccess ? (
                  <Alert className="border-blue-500 bg-blue-50">
                    <LogOut className="h-4 w-4 text-blue-500" />
                    <AlertDescription className="text-blue-700">
                      <strong>{scanResult.user.name}</strong>님의 퇴근 처리가 완료되었습니다.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-green-500 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-green-700">
                      유효한 QR코드입니다. 출입이 승인되었습니다.
                    </AlertDescription>
                  </Alert>
                )}

                {scanResult.checkoutSuccess === false && (
                  <Alert className="border-orange-500 bg-orange-50">
                    <XCircle className="h-4 w-4 text-orange-500" />
                    <AlertDescription className="text-orange-700">
                      퇴근 처리 실패: {scanResult.checkoutMessage}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">이름</p>
                      <p className="font-semibold">{scanResult.user.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">연락처</p>
                      <p className="font-semibold">{scanResult.user.phone}</p>
                    </div>
                  </div>

                  {scanResult.user.construction_plan && (
                    <div className="flex items-center gap-3">
                      <Building className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">공사명</p>
                        <p className="font-semibold">{scanResult.user.construction_plan.title}</p>
                        <p className="text-sm text-gray-600">{scanResult.user.construction_plan.company}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-center pt-4 border-t">
                  <p className="text-sm text-gray-500">처리 시간: {new Date().toLocaleString("ko-KR")}</p>
                  {scanResult.checkoutSuccess && (
                    <p className="text-sm text-blue-600 font-medium mt-1">상태: 퇴근완료</p>
                  )}
                </div>
              </div>
            ) : (
              <Alert className="border-red-500 bg-red-50">
                <XCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-700">{scanResult.error}</AlertDescription>
              </Alert>
            )}

            <div className="mt-4">
              <Button onClick={() => setScanResult(null)} variant="outline" className="w-full">
                다시 스캔
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
