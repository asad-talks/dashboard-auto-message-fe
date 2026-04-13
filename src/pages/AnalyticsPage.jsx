import { useEffect, useState } from 'react'
import api from '../utils/api'

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({ userbots: 0, groups: 0, posts: 0, activePosts: 0 })

  useEffect(() => {
    Promise.all([api.get('/userbots'), api.get('/groups'), api.get('/posts/all')]).then(([u, g, p]) => {
      setSummary({
        userbots: u.data.length,
        groups: g.data.length,
        posts: p.data.length,
        activePosts: p.data.filter(x => x.is_active === 1).length,
      })
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-lg font-semibold text-white">Analytics</h1>
        <p className="text-sm text-gray-600">Live counts from available backend endpoints</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5"><div className="text-xs text-gray-600">Userbots</div><div className="text-2xl text-white font-semibold mt-2">{summary.userbots}</div></div>
        <div className="card p-5"><div className="text-xs text-gray-600">Groups</div><div className="text-2xl text-white font-semibold mt-2">{summary.groups}</div></div>
        <div className="card p-5"><div className="text-xs text-gray-600">Saved Auto Posts</div><div className="text-2xl text-white font-semibold mt-2">{summary.posts}</div></div>
        <div className="card p-5"><div className="text-xs text-gray-600">Active Auto Posts</div><div className="text-2xl text-white font-semibold mt-2">{summary.activePosts}</div></div>
      </div>
    </div>
  )
}
