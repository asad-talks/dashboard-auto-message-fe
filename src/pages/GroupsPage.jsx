import { useEffect, useState } from 'react'
import { Plus, Trash2, X, FolderOpen } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

function AddGroupModal({ userbots, onClose, onCreated }) {
  const [form, setForm] = useState({ user_id: '', chat_title: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/groups', { user_id: Number(form.user_id), chat_title: form.chat_title })
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
          <h2 className="text-sm font-semibold text-white">Assign Group to Userbot</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-400 p-1"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">Userbot *</label>
            <select className="input" value={form.user_id} onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))} required>
              <option value="">Select userbot...</option>
              {userbots.map(d => <option key={d.user_id} value={d.user_id}>{d.phone}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">Group Username *</label>
            <input className="input font-mono" placeholder="@my_group or my_group" value={form.chat_title}
              onChange={e => setForm(f => ({ ...f, chat_title: e.target.value }))} required />
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
  const [userbots, setUserbots] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [filterUserId, setFilterUserId] = useState('')

  const loadData = () => {
    Promise.all([api.get('/groups'), api.get('/userbots')]).then(([g, d]) => {
      setGroups(g.data)
      setUserbots(d.data)
    }).finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDelete = async (id) => {
    if (!confirm('Remove this group?')) return
    try {
      await api.delete(`/groups/${id}`)
      setGroups(gs => gs.filter(g => g.id !== id))
      toast.success('Group removed')
    } catch {
      toast.error('Failed')
    }
  }

  const filtered = filterUserId ? groups.filter(g => g.user_id === Number(filterUserId)) : groups

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <div><h1 className="text-lg font-semibold text-white">Groups</h1><p className="text-sm text-gray-600">{groups.length} total groups</p></div>
        <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={14} /> Assign Group</button>
      </div>

      <div className="flex items-center gap-3">
        <select className="input max-w-xs" value={filterUserId} onChange={e => setFilterUserId(e.target.value)}>
          <option value="">All userbots</option>
          {userbots.map(d => <option key={d.user_id} value={d.user_id}>{d.phone}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {userbots.filter(u => !filterUserId || u.user_id === Number(filterUserId)).map((userbot) => {
          const uGroups = filtered.filter(g => g.user_id === userbot.user_id)
          return (
            <div key={userbot.user_id} className="card">
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.05]">
                <span className="text-xs font-mono font-medium text-gray-300">{userbot.phone}</span>
                <span className="text-xs text-gray-600">{uGroups.length} groups</span>
              </div>
              {uGroups.length === 0 ? (
                <div className="px-5 py-6 text-xs text-gray-700 flex items-center gap-2"><FolderOpen size={14} className="text-gray-800" />No groups assigned</div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {uGroups.map(g => (
                    <div key={g.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors">
                      <div className="text-xs font-mono text-indigo-400">{g.chat_title}</div>
                      <button onClick={() => handleDelete(g.id)} className="btn-danger"><Trash2 size={11} /> Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {showAdd && <AddGroupModal userbots={userbots} onClose={() => setShowAdd(false)} onCreated={loadData} />}
    </div>
  )
}
