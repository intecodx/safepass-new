"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode"

export default function QRScanner() {
  const [scannedText, setScannedText] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [modalMessage, setModalMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [scannerError, setScannerError] = useState<string | null>(null)

  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const isPausedRef = useRef(false)
  const lastPayloadRef = useRef<string | null>(null)
  const lastTimeRef = useRef<number>(0)
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null)
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const originalError = console.error
    const suppressedErrors = ["Cannot set properties of null", "setHeaderMessage", "innerText", "innerHTML"]

    console.error = (...args) => {
      const message = args.join(" ")
      if (suppressedErrors.some((error) => message.includes(error))) {
        return // Suppress these specific errors
      }
      originalError.apply(console, args)
    }

    const initScanner = () => {
      const readerElement = document.getElementById("reader")
      if (!readerElement) {
        console.error("[v0] Reader element not found")
        setScannerError("스캐너 초기화 실패: DOM 요소를 찾을 수 없습니다.")
        return
      }

      if (document.readyState !== "complete") {
        setTimeout(initScanner, 200)
        return
      }

      try {
        const scanner = new Html5QrcodeScanner(
          "reader",
          {
            fps: 10,
            qrbox: { width: 600, height: 600 },
            rememberLastUsedCamera: true,
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
            showTorchButtonIfSupported: true,
            showZoomSliderIfSupported: true,
            defaultZoomValueIfSupported: 2,
            verbose: false,
          },
          false,
        )

        try {
          scanner.render(onScanSuccess, onScanFailure)
          scannerRef.current = scanner
          setScannerError(null)
          console.log("[v0] QR Scanner initialized successfully")
        } catch (renderError) {
          console.warn("[v0] Scanner render warning:", renderError)
          scannerRef.current = scanner
          setScannerError(null)
        }
      } catch (error) {
        console.error("[v0] Scanner initialization error:", error)
        setScannerError("스캐너 초기화 실패: " + (error as Error).message)
      }
    }

    initTimeoutRef.current = setTimeout(initScanner, 300)

    return () => {
      console.error = originalError

      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current)
        initTimeoutRef.current = null
      }

      if (scannerRef.current) {
        try {
          scannerRef.current.clear().catch((error) => {
            console.warn("[v0] Scanner cleanup warning:", error)
          })
        } catch (error) {
          console.warn("[v0] Scanner cleanup error:", error)
        }
        scannerRef.current = null
      }

      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current)
        autoCloseTimerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onScanSuccess = async (decodedText: string) => {
    const now = Date.now()
    if (decodedText === lastPayloadRef.current && now - lastTimeRef.current < 1200) return
    lastPayloadRef.current = decodedText
    lastTimeRef.current = now

    try {
      ;(scannerRef.current as any)?.pause?.(true)
      isPausedRef.current = true
    } catch (error) {
      console.warn("[v0] Scanner pause error:", error)
    }

    setScannedText(decodedText)
    await processQRCode(decodedText)
  }

  const onScanFailure = (error: any) => {
    const msg = (typeof error === "string" ? error : error?.message || "").toString()
    if (
      msg.includes("NotFoundException") ||
      msg.includes("No MultiFormat Readers") ||
      msg.includes("QR code parse error") ||
      msg.includes("Camera not found") ||
      msg.includes("Permission denied") ||
      msg.includes("Cannot set properties of null") ||
      msg.includes("setHeaderMessage")
    ) {
      return
    }
    console.warn("[v0] QR scan failure:", msg)
  }

  const processQRCode = async (qrText: string) => {
    setIsLoading(true)
    setShowModal(true)

    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current)
      autoCloseTimerRef.current = null
    }

    try {
      let userData: any
      try {
        userData = JSON.parse(qrText)
      } catch {
        const m = qrText.match(/\/verify\/(\d+)/)
        userData = m ? { id: Number(m[1]) } : { id: qrText }
      }

      const response = await fetch("/api/verify-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrData: userData }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setUserInfo(result.user)

        const scanTime = new Date().toLocaleString("ko-KR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
          timeZone: "Asia/Seoul",
        })

        let displayMessage = ""
        if (result.user.isExit) {
          displayMessage = `🎉 ${result.user.name}님 퇴근완료!\n\n이름: ${result.user.name}\n소속업체: ${result.user.company}\n연락처: ${result.user.phone}\n퇴근시간: ${scanTime}`
        } else {
          displayMessage = `🎉 ${result.user.name}님이 출입하셨습니다!\n\n이름: ${result.user.name}\n소속업체: ${result.user.company}\n연락처: ${result.user.phone}\n출입시간: ${scanTime}`
        }

        setModalMessage(displayMessage)

        console.log("[v0] QR 스캔 완료 - 시간:", scanTime, "사용자:", result.user.name)

        if (typeof window !== "undefined") {
          localStorage.setItem("inteco_scan_update", Date.now().toString())
          console.log("[v0] 대시보드 새로고침 신호 전송")
        }

        autoCloseTimerRef.current = setTimeout(() => {
          closeModal()
        }, 3000)
      } else {
        setModalMessage(`❌ 출입 거부\n\n${result.message || "유효하지 않은 QR코드입니다."}`)
      }
    } catch (error) {
      console.error("[v0] QR verification error:", error)
      setModalMessage("❌ 시스템 오류\n\n잠시 후 다시 시도해주세요.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScannedText(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleManualInputSubmit()
  }

  const handleManualInputSubmit = async () => {
    if (scannedText.trim()) await processQRCode(scannedText.trim())
  }

  const closeModal = () => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current)
      autoCloseTimerRef.current = null
    }

    setShowModal(false)
    setModalMessage("")
    setUserInfo(null)
    setTimeout(() => {
      setScannedText("")
      try {
        if (isPausedRef.current && scannerRef.current) {
          ;(scannerRef.current as any)?.resume?.()
          isPausedRef.current = false
        }
      } catch (error) {
        console.warn("[v0] Scanner resume error:", error)
        try {
          const readerElement = document.getElementById("reader")
          if (readerElement && scannerRef.current) {
            scannerRef.current
              .clear()
              .then(() => {
                scannerRef.current?.render(onScanSuccess, onScanFailure)
              })
              .catch((error) => {
                console.error("[v0] Scanner restart error:", error)
              })
          }
        } catch (restartError) {
          console.error("[v0] Scanner restart fallback error:", restartError)
        }
      }
    }, 300)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <a href="/" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600">
                홈
              </a>
            </li>
            <li>
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">&gt;</span>
                <a href="/security" className="text-sm font-medium text-gray-700 hover:text-blue-600">
                  경비실 시스템
                </a>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">&gt;</span>
                <span className="text-sm font-medium text-gray-500">QR 스캐너</span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">QR 코드 스캔</h2>

          {scannerError && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              <p className="font-medium">스캐너 오류:</p>
              <p className="text-sm">{scannerError}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                페이지 새로고침
              </button>
            </div>
          )}

          <div className="space-y-6">
            <div className="w-full">
              <div id="reader" className="w-full min-h-[600px] border border-gray-300 rounded-lg overflow-hidden" />
            </div>

            <div className="max-w-2xl mx-auto space-y-4">
              <div>
                <label htmlFor="qr-text" className="block text-sm font-medium text-gray-700 mb-2">
                  QR 텍스트 (수동 입력 또는 스캔 결과)
                </label>
                <input
                  type="text"
                  id="qr-text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={scannedText}
                  onChange={handleManualInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="QR 코드 텍스트가 여기에 표시됩니다."
                />
              </div>
              <button
                onClick={handleManualInputSubmit}
                className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200 shadow-md"
              >
                수동 입력 처리
              </button>
            </div>
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
            <div className="relative p-8 bg-white w-full max-w-lg mx-auto rounded-xl shadow-2xl border max-h-[90vh] overflow-y-auto">
              {isLoading ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-lg">검증 중...</p>
                </div>
              ) : (
                <div>
                  <pre className="text-lg whitespace-pre-wrap">{modalMessage}</pre>
                </div>
              )}
              <div className="text-right mt-6">
                <button
                  onClick={closeModal}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200 shadow-md"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
