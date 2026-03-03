"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard,
  Users,
  HardHat,
  CheckCircle,
  BarChart3,
  Menu,
  X,
  LogOut,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Home,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const navigation = [
  { name: "대시보드", href: "/wie-admin/dashboard", icon: LayoutDashboard },
  { name: "출입현황", href: "/wie-admin/entry-status", icon: ClipboardList },
  { name: "신청 관리", href: "/wie-admin/applications", icon: Users },
  { name: "공사 계획", href: "/wie-admin/construction-plans", icon: HardHat },
  { name: "승인 조회/변경", href: "/wie-admin/status", icon: CheckCircle },
  { name: "통계", href: "/wie-admin/statistics", icon: BarChart3 },
]

export default function WieAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const savedCollapsed = localStorage.getItem("wie-admin-sidebar-collapsed")
    if (savedCollapsed !== null) {
      setIsCollapsed(savedCollapsed === "true")
    }
  }, [])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/wie-admin/auth/check")
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

    checkAuth()
  }, [router])

  const handleLogout = async () => {
    try {
      await fetch("/api/wie-admin/auth/logout", { method: "POST" })
      router.push("/admin/login")
    } catch (error) {
      console.error("로그아웃 실패:", error)
    }
  }

  const toggleCollapse = () => {
    const newCollapsed = !isCollapsed
    setIsCollapsed(newCollapsed)
    localStorage.setItem("wie-admin-sidebar-collapsed", String(newCollapsed))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white h-full shadow-xl">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4 mb-8">
                <span className="text-lg font-semibold text-purple-600">Safepass System2</span>
              </div>
              <nav className="px-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`${
                        isActive
                          ? "bg-purple-100 text-purple-900"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      } group flex items-center px-3 py-3 text-base font-medium rounded-md transition-colors`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon
                        className={`${
                          isActive ? "text-purple-500" : "text-gray-400 group-hover:text-gray-500"
                        } mr-4 flex-shrink-0 h-6 w-6`}
                      />
                      {item.name}
                    </Link>
                  )
                })}
                <Link
                  href="/"
                  className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-3 py-3 text-base font-medium rounded-md transition-colors border-t border-gray-200 mt-4 pt-4"
                  onClick={() => setSidebarOpen(false)}
                >
                  <Home className="text-gray-400 group-hover:text-gray-500 mr-4 flex-shrink-0 h-6 w-6" />
                  메인으로 돌아가기
                </Link>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div
        className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 transition-all duration-300 ${isCollapsed ? "lg:w-20" : "lg:w-64"}`}
      >
        <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className={`flex items-center flex-shrink-0 px-4 ${isCollapsed ? "justify-center" : ""}`}>
              {isCollapsed ? (
                <span className="text-lg font-bold text-purple-600">S</span>
              ) : (
                <span className="text-lg font-semibold text-purple-600">Safepass System2</span>
              )}
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1 flex flex-col">
              <div className="flex-1 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`${
                        isActive
                          ? "bg-purple-100 text-purple-900"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      } group flex items-center ${isCollapsed ? "justify-center px-2" : "px-2"} py-2 text-sm font-medium rounded-md`}
                      title={isCollapsed ? item.name : undefined}
                    >
                      <item.icon
                        className={`${
                          isActive ? "text-purple-500" : "text-gray-400 group-hover:text-gray-500"
                        } ${isCollapsed ? "" : "mr-3"} flex-shrink-0 h-6 w-6`}
                      />
                      {!isCollapsed && item.name}
                    </Link>
                  )
                })}
              </div>
              <Link
                href="/"
                className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md border-t border-gray-200 mt-auto pt-4"
                title={isCollapsed ? "메인으로 돌아가기" : undefined}
              >
                <Home
                  className={`text-gray-400 group-hover:text-gray-500 ${isCollapsed ? "" : "mr-3"} flex-shrink-0 h-6 w-6`}
                />
                {!isCollapsed && "메인으로 돌아가기"}
              </Link>
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`flex flex-col flex-1 transition-all duration-300 ${isCollapsed ? "lg:pl-20" : "lg:pl-64"}`}>
        {/* Top bar */}
        <div className="sticky top-0 z-10 lg:hidden bg-white border-b shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              type="button"
              className="inline-flex items-center justify-center h-10 w-10 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Safepass System2</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center space-x-1 bg-transparent"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">로그아웃</span>
            </Button>
          </div>
        </div>

        {/* Header */}
        <header className="hidden lg:block bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-end items-center">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleCollapse}
                className="flex items-center space-x-2 bg-transparent"
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                {!isCollapsed && <span>메뉴 접기</span>}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-transparent"
              >
                <LogOut className="w-4 h-4" />
                <span>로그아웃</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  )
}
