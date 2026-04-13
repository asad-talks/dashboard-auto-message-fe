import { useEffect, useState } from 'react'
import { Users, Wallet, MessageSquare, Layers } from 'lucide-react'
import api from '../utils/api'

function StatCard({ icon: Icon, label, value, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    sky: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  }
  return (
    <div className="card card-hover p-5 fade-in">
      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-3 ${colors[color]}`}><Icon size={16} /></div>
      <div className="text-2xl font-semibold text-white tracking-tight">{value}</div>
      <div className="text-xs text-gray-600 mt-0.5">{label}</div>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userbots, setUserbots] = useState([])

  useEffect(() => {
    Promise.all([api.get('/userbots/stats/overview'), api.get('/userbots')]).then(([statsRes, userbotsRes]) => {
      setStats(statsRes.data)
      setUserbots(userbotsRes.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-lg font-semibold text-white">Dashboard</h1>
        <p className="text-sm text-gray-600">Overview of your userbots</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Total Userbots" value={stats?.total_userbots ?? 0} color="indigo" />
        <StatCard icon={Wallet} label="Total Balance" value={Number(stats?.total_balance ?? 0).toFixed(2)} color="amber" />
        <StatCard icon={Layers} label="Total Groups" value={stats?.total_groups ?? 0} color="emerald" />
        <StatCard icon={MessageSquare} label="Active Auto Posts" value={stats?.active_autoposts ?? 0} color="sky" />
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Userbots</h2>
          <span className="text-xs text-gray-600">{userbots.length} total</span>
        </div>
        <div className="space-y-2">
          {userbots.map((u) => (
            <div key={u.user_id} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
              <span className="text-xs font-mono text-gray-400">{u.phone}</span>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-gray-600">{u.groups_count} groups</span>
                <span className="text-emerald-400">{Number(u.balance || 0).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
