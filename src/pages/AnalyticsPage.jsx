import { useEffect, useState } from 'react'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from 'recharts'
import api from '../utils/api'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1a1a2e] border border-white/10 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-500 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {typeof p.value === 'number' && p.name?.includes('$') ? `$${p.value.toFixed(2)}` : p.value}
        </p>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const [msgData, setMsgData] = useState([])
  const [topDrivers, setTopDrivers] = useState([])
  const [balanceData, setBalanceData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/analytics/messages-per-day'),
      api.get('/analytics/top-drivers'),
      api.get('/analytics/balance-history'),
    ]).then(([m, d, b]) => {
      setMsgData(m.data.map(r => ({ ...r, date: r.date.slice(5) })))
      setTopDrivers(d.data.map(r => ({ ...r, phone: r.phone.slice(-7) })))
      setBalanceData(b.data.map(r => ({ ...r, date: r.date.slice(5), total_topup: parseFloat(r.total_topup) })))
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-5 max-w-6xl">
      <div>
        <h1 className="text-lg font-semibold text-white">Analytics</h1>
        <p className="text-sm text-gray-600">Last 30 days performance</p>
      </div>

      {/* Messages per day */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-white mb-5">Posts Sent Per Day</h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={msgData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorMsg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date" tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="count" name="Messages" stroke="#6366f1" strokeWidth={2}
              fill="url(#colorMsg)" dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top drivers */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-white mb-5">Top Active Drivers</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topDrivers} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="phone" tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="messages_sent" name="Messages" fill="#6366f1" radius={[4, 4, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Balance history */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-white mb-5">Balance Top-ups</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={balanceData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="total_topup" name="$Topup" stroke="#10b981" strokeWidth={2}
                fill="url(#colorBal)" dot={false} activeDot={{ r: 4, fill: '#10b981' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
