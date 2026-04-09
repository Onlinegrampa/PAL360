'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { LayoutDashboard, FileText, Package, CreditCard, LogOut, Activity, Users } from 'lucide-react'
import { useAuth } from '@/lib/auth'

const navItems = [
  { href: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/claims',     icon: FileText,         label: 'Claims' },
  { href: '/products',   icon: Package,          label: 'Products' },
  { href: '/fact-find',  icon: Activity,          label: 'Health' },
  { href: '/agents',     icon: Users,             label: 'Agents' },
  { href: '/payment',    icon: CreditCard,        label: 'Pay' },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    router.replace('/login')
  }

  const userInitials = user?.email?.slice(0, 2).toUpperCase() ?? 'ME'

  return (
    <div className="min-h-screen bg-[#f4f6fa] flex flex-col">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-[#002855] flex-col z-40">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#C9A84C] rounded-xl flex items-center justify-center">
              <span className="text-[#002855] font-bold text-sm">PAL</span>
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-none">PAL360</p>
              <p className="text-white/50 text-xs mt-0.5">Client Portal</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                  active
                    ? 'bg-[#C9A84C] text-[#002855]'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User + logout */}
        <div className="p-4 border-t border-white/10 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[#C9A84C] text-xs font-bold">{userInitials}</span>
            </div>
            <p className="text-white/60 text-xs truncate">{user?.email ?? ''}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition-all text-sm font-medium"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-64 pb-20 md:pb-0">
        {/* Mobile header */}
        <header className="md:hidden bg-[#002855] px-5 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#C9A84C] rounded-lg flex items-center justify-center">
              <span className="text-[#002855] font-bold text-xs">PAL</span>
            </div>
            <span className="text-white font-bold text-lg">PAL360</span>
          </div>
          <button
            onClick={handleSignOut}
            className="text-white/60 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Sign out"
          >
            <LogOut size={18} />
          </button>
        </header>

        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="grid grid-cols-6">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center py-3 gap-1 text-xs font-medium transition-colors ${
                  active ? 'text-[#002855]' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                <span>{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
