"use client"

import { useEffect, useState } from "react"
import { testSupabaseConnection } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

interface TestResult {
  success: boolean
  message?: string
  error?: string
  details?: string[]
}

export default function SupabaseConnectionTest() {
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  // 콘솔 로그를 캡처하는 함수
  const captureConsoleLog = () => {
    const originalLog = console.log
    const originalError = console.error
    const newLogs: string[] = []

    console.log = (...args) => {
      newLogs.push(`[LOG] ${args.join(" ")}`)
      originalLog(...args)
    }

    console.error = (...args) => {
      newLogs.push(`[ERROR] ${args.join(" ")}`)
      originalError(...args)
    }

    return () => {
      console.log = originalLog
      console.error = originalError
      setLogs(newLogs)
    }
  }

  const runTest = async () => {
    setIsLoading(true)
    setTestResult(null)
    setLogs([])

    const restoreConsole = captureConsoleLog()

    try {
      const result = await testSupabaseConnection()
      setTestResult(result)
    } catch (error: any) {
      setTestResult({
        success: false,
        error: error.message,
      })
    } finally {
      restoreConsole()
      setIsLoading(false)
    }
  }

  // 페이지 로드 시 자동 테스트
  useEffect(() => {
    runTest()
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔗 Supabase 연결 테스트
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runTest} disabled={isLoading} className="w-full">
            {isLoading ? "테스트 중..." : "연결 테스트 실행"}
          </Button>

          {testResult && (
            <Alert className={testResult.success ? "border-green-500" : "border-red-500"}>
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <AlertDescription>
                  {testResult.success ? (
                    <span className="text-green-700 font-semibold">✅ {testResult.message}</span>
                  ) : (
                    <span className="text-red-700 font-semibold">❌ {testResult.error}</span>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>

      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📋 상세 로그</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-green-700 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>📝 설정 가이드</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">1. lib/supabase.ts 파일에서 설정:</h4>
              <div className="bg-gray-100 p-3 rounded text-sm">
                <p>const supabaseUrl = "https://YOUR_PROJECT_ID.supabase.co"</p>
                <p>const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIs..."</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">2. Supabase 대시보드에서 확인:</h4>
              <ul className="text-sm space-y-1 ml-4">
                <li>• Settings → API 메뉴</li>
                <li>• Project URL 복사</li>
                <li>• anon public 키 복사</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">3. 일반적인 오류들:</h4>
              <ul className="text-sm space-y-1 ml-4">
                <li>• "Invalid API key" → 키가 잘못됨</li>
                <li>• "fetch failed" → URL이 잘못됨</li>
                <li>• "CORS error" → 브라우저 보안 정책</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {testResult?.success && (
        <Card className="border-green-500">
          <CardHeader>
            <CardTitle className="text-green-700">🎉 연결 성공! 다음 단계</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p>Supabase 연결이 완료되었습니다!</p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">이제 알려주세요:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 데이터베이스에 어떤 테이블들이 있나요?</li>
                  <li>• 각 테이블의 컬럼 구조는 어떻게 되나요?</li>
                  <li>• 어떤 화면을 만들고 싶으신가요?</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
