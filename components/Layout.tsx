'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { useSessionTimeout } from '@/lib/useSessionTimeout'

// Component that handles session timeout for authenticated users
function AuthenticatedLayout({ children, sidebarOpen, setSidebarOpen }: {
  children: React.ReactNode;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}) {
  // Set up session timeout for authenticated users
  useSessionTimeout(5) // 5 minutes

  return (
    <div className="min-h-screen bg-slate-50">
      <Header onMenuClick={() => setSidebarOpen(true)} />

      {/* Mobile sidebar - partial overlay that slides over content */}
      <div className={`fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="w-64 bg-white shadow-2xl min-h-screen border-r border-slate-200">
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>
      </div>

      {/* Overlay only for the area to the right of the sidebar */}
      {sidebarOpen && (
        <div
          className="fixed top-0 right-0 bottom-0 left-64 z-40 lg:hidden bg-transparent"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex">
        {/* Desktop sidebar */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Main content - remains fully visible behind sidebar */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 overflow-x-auto">
          <div className="max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, loading, signingOut } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-300 border-t-blue-600"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (signingOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-300 border-t-blue-600"></div>
          <p className="mt-4 text-slate-600">Signing out...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <AuthenticatedLayout
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
    >
      {children}
    </AuthenticatedLayout>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <Header onMenuClick={() => setSidebarOpen(true)} />

      {/* Mobile sidebar - partial overlay that slides over content */}
      <div className={`fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="w-64 bg-white shadow-2xl min-h-screen border-r border-slate-200">
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>
      </div>

      {/* Overlay only for the area to the right of the sidebar */}
      {sidebarOpen && (
        <div
          className="fixed top-0 right-0 bottom-0 left-64 z-40 lg:hidden bg-transparent"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex">
        {/* Desktop sidebar */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Main content - remains fully visible behind sidebar */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 overflow-x-auto">
          <div className="max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
