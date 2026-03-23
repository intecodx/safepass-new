"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, Users, Building, BarChart3, LogOut, FileCheck, Menu, X, Home, UserCheck } from "lucide-react"

const navigation = [
  { name: "대시보드", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "출입현황", href: "/admin/entry-status", icon: UserCheck },
  { name: "신청 관리", href: "/admin/applications", icon: Users },
  { name: "공사 계획", href: "/admin/construction-plans", icon: Building },
  { name: "승인 조회/변경", href: "/admin/status", icon: FileCheck },
  { name: "통계", href: "/admin/statistics", icon: BarChart3 },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAuth = async () => {
      if (pathname === "/admin/login") {
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch("/api/admin/check-auth")
        const data = await response.json()

        if (data.authenticated) {
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
          router.push("/admin/login")
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        setIsAuthenticated(false)
        router.push("/admin/login")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [pathname, router])

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/admin/logout", { method: "POST" })

      if (response.ok) {
        setIsAuthenticated(false)
        window.location.href = "/admin/login"
      } else {
        console.error("Logout failed")
      }
    } catch (error) {
      console.error("Logout failed:", error)
      window.location.href = "/admin/login"
    }
  }

  if (pathname === "/admin/login") {
    return <>{children}</>
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">인증 확인 중...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="hidden lg:flex fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-16">
        <div
          className={`${isSidebarCollapsed ? "w-16" : "w-64"} flex items-center justify-center border-r border-gray-200 transition-all duration-300`}
        >
          {!isSidebarCollapsed && (
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Safepass System
            </h1>
          )}
        </div>
        <div className="flex-1 flex items-center justify-end px-6">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 transition-colors mr-3"
            title="사이드바 토글"
          >
            <Menu className="h-4 w-4" />
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="mr-2 h-4 w-4" />
            로그아웃
          </button>
        </div>
      </div>

      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-16">
        <div className="flex items-center justify-between h-full px-4">
          <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Safepass System
          </h1>
          <div className="flex items-center space-x-2">
            <button onClick={handleLogout} className="p-2 rounded-md text-red-600 hover:text-red-700 hover:bg-red-50">
              <LogOut className="h-5 w-5" />
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 bg-white shadow-lg transform transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${isSidebarCollapsed ? "lg:w-16" : "lg:w-64"} w-64`}
        style={{ top: "64px" }}
      >
        <nav className="h-full flex flex-col">
          <div className="flex-1 px-4 py-6">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                      title={isSidebarCollapsed ? item.name : undefined}
                    >
                      <item.icon className={`h-5 w-5 ${isSidebarCollapsed ? "mx-auto" : "mr-3"}`} />
                      {(!isSidebarCollapsed || window.innerWidth < 1024) && item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="border-t border-gray-200 p-4 space-y-2">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              title={isSidebarCollapsed ? "메인으로 돌아가기" : undefined}
            >
              <Home className={`h-5 w-5 ${isSidebarCollapsed ? "mx-auto" : "mr-3"}`} />
              {(!isSidebarCollapsed || window.innerWidth < 1024) && "메인으로 돌아가기"}
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors lg:hidden"
            >
              <LogOut className="mr-3 h-5 w-5" />
              로그아웃
            </button>
          </div>
        </nav>
      </div>

      <div className={`transition-all duration-300 ${isSidebarCollapsed ? "lg:pl-16" : "lg:pl-64"}`}>
        <main className="pt-16 min-h-screen">
          <div className="py-6 px-4 lg:py-8 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
