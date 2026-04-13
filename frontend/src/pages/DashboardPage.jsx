import { useEffect, useState } from 'react'
import { Users, Zap, Wallet, MessageSquare, TrendingUp, Clock } from 'lucide-react'
import api from '../utils/api'

function StatCard({ icon: Icon, label, value, sub, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    sky: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  }
  return (
    <div className="card card-hover p-5 fade-in">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${colors[color]}`}>
          <Icon size={16} />
        </div>
        <TrendingUp size={12} className="text-gray-700 mt-1" />
      </div>
      <div className="text-2xl font-semibold text-white tracking-tight">{value}</div>
      <div className="text-xs text-gray-600 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-700 mt-2 pt-2 border-t border-white/[0.04]">{sub}</div>}
    </div>
  )
}

function ActivityItem({ item, idx }) {
  const actionColors = {
    broadcast_sent: 'text-indigo-400',
    balance_topup: 'text-emerald-400',
    userbot_offline: 'text-red-400',
    group_added: 'text-sky-400',
    driver_created: 'text-amber-400',
  }
  const actionLabels = {
    broadcast_sent: 'Broadcast sent',
    balance_topup: 'Balance topped up',
    userbot_offline: 'Userbot went offline',
    group_added: 'Group added',
    driver_created: 'Driver created',
  }
  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/[0.04] last:border-0 slide-in" style={{ animationDelay: `${idx * 40}ms` }}>
      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/60 mt-2 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-gray-300 font-mono">{item.driver_phone || 'system'}</span>
          <span className={`text-xs ${actionColors[item.action] || 'text-gray-500'}`}>
            {actionLabels[item.action] || item.action}
          </span>
        </div>
        {item.details && <div className="text-xs text-gray-600 mt-0.5 truncate">{item.details}</div>}
      </div>
      <div className="text-[10px] text-gray-700 flex items-center gap-1 flex-shrink-0">
        <Clock size={9} />
        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [drivers, setDrivers] = useState([])

  useEffect(() => {
    Promise.all([
      api.get('/drivers/stats/overview'),
      api.get('/drivers'),
    ]).then(([statsRes, driversRes]) => {
      setStats(statsRes.data)
      setDrivers(driversRes.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-white">Dashboard</h1>
        <p className="text-sm text-gray-600">Overview of your taxi bot network</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Total Drivers" value={stats?.total_drivers ?? 0} color="indigo" />
        <StatCard icon={Zap} label="Active Userbots" value={stats?.active_userbots ?? 0}
          sub={`${stats?.total_drivers ? Math.round((stats.active_userbots / stats.total_drivers) * 100) : 0}% online`}
          color="emerald" />
        <StatCard icon={Wallet} label="Total Balance" value={`$${(stats?.total_balance ?? 0).toFixed(2)}`} color="amber" />
        <StatCard icon={MessageSquare} label="Messages Today" value={stats?.messages_today ?? 0} color="sky" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Activity feed */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Recent Activity</h2>
            <span className="text-[10px] text-gray-700 uppercase tracking-wider">Live</span>
          </div>
          <div>
            {stats?.recent_activity?.length > 0
              ? stats.recent_activity.map((item, i) => <ActivityItem key={item.id} item={item} idx={i} />)
              : <p className="text-xs text-gray-600 py-4 text-center">No activity yet</p>
            }
          </div>
        </div>

        {/* Userbot status */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Userbot Status</h2>
            <span className="text-xs text-gray-600">{drivers.length} total</span>
          </div>
          <div className="space-y-2">
            {drivers.map((d, i) => (
              <div key={d.id} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0 slide-in" style={{ animationDelay: `${i * 30}ms` }}>
                <div className="flex items-center gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${d.userbot_status === 'online' ? 'bg-emerald-400 pulse-dot' : 'bg-gray-700'}`} />
                  <span className="text-xs font-mono text-gray-400">{d.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-600">{d.groups_count} groups</span>
                  <span className={d.userbot_status === 'online' ? 'badge-online' : 'badge-offline'}>
                    {d.userbot_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
