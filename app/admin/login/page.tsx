"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Lock } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Logo } from "@/components/ui/logo"

export default function AdminLoginPage() {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.userType === "security") {
          router.push("/security/dashboard")
        } else if (data.userType === "wie-admin") {
          router.push("/wie-admin/dashboard")
        } else if (data.userType === "wie-security") {
          router.push("/wie-security/dashboard")
        } else {
          router.push("/admin/dashboard")
        }
      } else {
        alert("로그인 정보가 올바르지 않습니다.")
      }
    } catch (error) {
      console.error("로그인 실패:", error)
      alert("로그인 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
          <Link href="/" className="mr-4">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <Logo size="sm" showText={true} href="/" className="mr-4" />
          <h1 className="text-xl font-semibold text-gray-900">관리자 로그인</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-center justify-center">
              <Lock className="w-5 h-5" />
              <span>관리자 로그인</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">아이디</Label>
                <Input
                  id="username"
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  required
                  placeholder="아이디"
                  onFocus={(e) => {
                    if (e.target.value === "") {
                      e.target.placeholder = ""
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value === "") {
                      e.target.placeholder = "아이디"
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  required
                  placeholder="비밀번호"
                  onFocus={(e) => {
                    if (e.target.value === "") {
                      e.target.placeholder = ""
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value === "") {
                      e.target.placeholder = "비밀번호"
                    }
                  }}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "로그인 중..." : "로그인"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
