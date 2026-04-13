import { useEffect, useState } from 'react'
import { Plus, Trash2, X, FolderOpen } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

function AddGroupModal({ drivers, onClose, onCreated }) {
  const [form, setForm] = useState({ driver_id: '', username: '', title: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/groups', { ...form, driver_id: parseInt(form.driver_id) })
      toast.success('Group added')
      onCreated(data)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="card w-full max-w-sm p-6 fade-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-white">Assign Group to Driver</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-400 p-1"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">Driver *</label>
            <select className="input" value={form.driver_id} onChange={e => setForm(f => ({ ...f, driver_id: e.target.value }))} required>
              <option value="">Select driver...</option>
              {drivers.map(d => <option key={d.id} value={d.id}>{d.phone}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">Group Username *</label>
            <input className="input font-mono" placeholder="@taxi_group or taxi_group" value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">Display Title</label>
            <input className="input" placeholder="Group display name" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Assign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function GroupsPage() {
  const [groups, setGroups] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [filterDriver, setFilterDriver] = useState('')

  useEffect(() => {
    Promise.all([api.get('/groups'), api.get('/drivers')]).then(([g, d]) => {
      setGroups(g.data)
      setDrivers(d.data)
    }).finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id) => {
    if (!confirm('Remove this group?')) return
    try {
      await api.delete(`/groups/${id}`)
      setGroups(gs => gs.filter(g => g.id !== id))
      toast.success('Group removed')
    } catch { toast.error('Failed') }
  }

  const filtered = filterDriver ? groups.filter(g => g.driver_id === parseInt(filterDriver)) : groups

  // Group by driver
  const byDriver = drivers.reduce((acc, d) => {
    acc[d.id] = { driver: d, groups: filtered.filter(g => g.driver_id === d.id) }
    return acc
  }, {})

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Groups</h1>
          <p className="text-sm text-gray-600">{groups.length} total groups</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={14} /> Assign Group
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <select className="input max-w-xs" value={filterDriver} onChange={e => setFilterDriver(e.target.value)}>
          <option value="">All drivers</option>
          {drivers.map(d => <option key={d.id} value={d.id}>{d.phone}</option>)}
        </select>
      </div>

      {/* Per-driver sections */}
      <div className="space-y-3">
        {Object.values(byDriver).map(({ driver, groups: dGroups }) => {
          if (filterDriver && driver.id !== parseInt(filterDriver)) return null
          return (
            <div key={driver.id} className="card">
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.05]">
                <div className={`w-2 h-2 rounded-full ${driver.userbot_status === 'online' ? 'bg-emerald-400' : 'bg-gray-700'}`} />
                <span className="text-xs font-mono font-medium text-gray-300">{driver.phone}</span>
                <span className="text-xs text-gray-600">{dGroups.length} groups</span>
              </div>
              {dGroups.length === 0 ? (
                <div className="px-5 py-6 text-xs text-gray-700 flex items-center gap-2">
                  <FolderOpen size={14} className="text-gray-800" />
                  No groups assigned
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {dGroups.map(g => (
                    <div key={g.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors">
                      <div>
                        <div className="text-xs font-mono text-indigo-400">{g.username}</div>
                        {g.title && <div className="text-[11px] text-gray-600 mt-0.5">{g.title}</div>}
                      </div>
                      <button onClick={() => handleDelete(g.id)} className="btn-danger">
                        <Trash2 size={11} /> Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {showAdd && <AddGroupModal drivers={drivers} onClose={() => setShowAdd(false)}
        onCreated={g => setGroups(gs => [...gs, g])} />}
    </div>
  )
}
