import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Users, FolderOpen, Megaphone,
  BarChart2, LogOut, Zap, Menu, X
} from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/drivers', icon: Users, label: 'Drivers' },
  { to: '/groups', icon: FolderOpen, label: 'Groups' },
  { to: '/broadcast', icon: Megaphone, label: 'Broadcast' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <Zap size={15} className="text-indigo-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white tracking-tight">TaxiBot</div>
            <div className="text-[10px] text-gray-600 font-mono uppercase tracking-widest">Admin Panel</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        <div className="text-[10px] font-semibold text-gray-700 uppercase tracking-widest px-3 pb-2">Menu</div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              clsx('nav-item', isActive ? 'nav-item-active' : 'nav-item-inactive')
            }
          >
            <Icon size={16} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-white/[0.05] mt-2">
        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.03] transition-colors group">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-semibold uppercase">
              {user?.username?.[0]}
            </div>
            <div>
              <div className="text-xs font-medium text-gray-300">{user?.username}</div>
              <div className="text-[10px] text-gray-600">Administrator</div>
            </div>
          </div>
          <button onClick={handleLogout} title="Logout"
            className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all p-1 rounded-lg hover:bg-red-500/10">
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0f]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 border-r border-white/[0.05] bg-[#0d0d15] flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-56 bg-[#0d0d15] border-r border-white/[0.05]">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-white/[0.05] bg-[#0d0d15]">
          <button onClick={() => setMobileOpen(true)} className="text-gray-400 hover:text-white p-1">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-indigo-400" />
            <span className="text-sm font-semibold">TaxiBot Admin</span>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
