"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Home, LogOut, QrCode, Menu, X, ChevronLeft, ChevronRight } from "lucide-react"

export default function SecurityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false)
  const router = useRouter()
  const pathname = usePathname() // Added usePathname to track current route for active state

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/security/check-auth")
      if (response.ok) {
        setIsAuthenticated(true)
      } else {
        router.push("/admin/login")
      }
    } catch (error) {
      console.error("인증 확인 실패:", error)
      router.push("/admin/login")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/security/logout", { method: "POST" })
      router.push("/admin/login")
    } catch (error) {
      console.error("로그아웃 실패:", error)
    }
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  const toggleDesktopSidebar = () => {
    setIsDesktopCollapsed(!isDesktopCollapsed)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
          경비실 시스템
        </h1>
        <div className="flex items-center space-x-2">
          <button onClick={handleLogout} className="p-2 text-red-600 hover:bg-red-50 rounded-lg lg:hidden">
            <LogOut className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
          <button
            onClick={toggleDesktopSidebar}
            className="hidden lg:flex p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            {isDesktopCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="flex">
        <div
          className={`
          fixed inset-y-0 left-0 z-50 bg-white shadow-sm border-r transform transition-all duration-300 ease-in-out
          lg:relative lg:translate-x-0 lg:top-0
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          ${isDesktopCollapsed ? "lg:w-16" : "lg:w-64"}
          w-64
        `}
        >
          <div className="lg:hidden absolute top-4 right-4">
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="mt-8 pt-4">
            <div className="px-3">
              <Link
                href="/security/dashboard"
                onClick={closeSidebar}
                className={`flex items-center px-3 py-2 rounded-lg mb-1 ${isDesktopCollapsed ? "lg:justify-center" : ""} ${
                  pathname === "/security/dashboard" ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                }`}
                title={isDesktopCollapsed ? "대시보드" : ""}
              >
                <Home className="w-5 h-5 mr-3 lg:mr-0" />
                <span
                  className={`lg:transition-opacity lg:duration-300 ${isDesktopCollapsed ? "lg:hidden" : "lg:block lg:ml-3"}`}
                >
                  대시보드
                </span>
              </Link>

              <Link
                href="/security/qr-scanner"
                onClick={closeSidebar}
                className={`flex items-center px-3 py-2 rounded-lg mb-1 ${isDesktopCollapsed ? "lg:justify-center" : ""} ${
                  pathname === "/security/qr-scanner" ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                }`}
                title={isDesktopCollapsed ? "QR 스캐너" : ""}
              >
                <QrCode className="w-5 h-5 mr-3 lg:mr-0" />
                <span
                  className={`lg:transition-opacity lg:duration-300 ${isDesktopCollapsed ? "lg:hidden" : "lg:block lg:ml-3"}`}
                >
                  QR 스캐너
                </span>
              </Link>

              <button
                onClick={handleLogout}
                className={`w-full flex items-center px-3 py-2 text-red-600 rounded-lg hover:bg-red-50 mb-1 ${isDesktopCollapsed ? "lg:justify-center" : ""}`}
                title={isDesktopCollapsed ? "로그아웃" : ""}
              >
                <LogOut className="w-5 h-5 mr-3 lg:mr-0" />
                <span
                  className={`lg:transition-opacity lg:duration-300 ${isDesktopCollapsed ? "lg:hidden" : "lg:block lg:ml-3"}`}
                >
                  로그아웃
                </span>
              </button>
            </div>
          </nav>
        </div>

        <div className={`flex-1 transition-all duration-300 ${isDesktopCollapsed ? "lg:ml-0" : "lg:ml-0"}`}>
          {children}
        </div>
      </div>
    </div>
  )
}
