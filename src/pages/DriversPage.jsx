import { useEffect, useState } from 'react'
import { Plus, Trash2, Search, X } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

function AddDriverModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ user_id: '', phone: '', api_id: '', api_hash: '', session_string: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        user_id: Number(form.user_id),
        phone: form.phone,
        api_id: form.api_id ? Number(form.api_id) : null,
        api_hash: form.api_hash || null,
        session_string: form.session_string || null,
      }
      const { data } = await api.post('/userbots', payload)
      toast.success('Userbot saved')
      onCreated(data)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save userbot')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="card w-full max-w-md p-6 fade-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-white">Add / Update Userbot</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-400 p-1"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">User ID *</label>
            <input className="input" type="number" value={form.user_id}
              onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))} required />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">Phone Number *</label>
            <input className="input" placeholder="+1234567890" value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">API ID</label>
            <input className="input" placeholder="12345678" value={form.api_id}
              onChange={e => setForm(f => ({ ...f, api_id: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">API Hash</label>
            <input className="input" value={form.api_hash}
              onChange={e => setForm(f => ({ ...f, api_hash: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">Session String</label>
            <input className="input" value={form.session_string}
              onChange={e => setForm(f => ({ ...f, session_string: e.target.value }))} />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TopupModal({ userbot, onClose, onUpdated }) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.patch(`/userbots/${userbot.user_id}/balance/topup`, { amount: parseFloat(amount) })
      toast.success(`Added ${amount} to ${userbot.phone}`)
      onUpdated(data)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Top up failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="card w-full max-w-sm p-6 fade-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-white">Top Up Balance</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-400 p-1"><X size={16} /></button>
        </div>
        <p className="text-xs text-gray-500 mb-4">Userbot: <span className="text-gray-300 font-mono">{userbot.phone}</span></p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">Amount *</label>
            <input className="input" type="number" step="0.01" min="0.01" value={amount}
              onChange={e => setAmount(e.target.value)} required autoFocus />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Top Up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [topupDriver, setTopupDriver] = useState(null)

  const loadUserbots = () => {
    api.get('/userbots').then(r => setDrivers(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => {
    loadUserbots()
  }, [])

  const handleDelete = async (userId) => {
    if (!confirm('Delete this userbot and all groups?')) return
    try {
      await api.delete(`/userbots/${userId}`)
      setDrivers(ds => ds.filter(d => d.user_id !== userId))
      toast.success('Userbot deleted')
    } catch {
      toast.error('Delete failed')
    }
  }

  const filtered = drivers.filter(d => String(d.phone || '').toLowerCase().includes(search.toLowerCase()))

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Userbots</h1>
          <p className="text-sm text-gray-600">{drivers.length} registered userbots</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={14} /> Add Userbot</button>
      </div>

      <div className="card">
        <div className="p-4 border-b border-white/[0.05]">
          <div className="relative max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
            <input className="input pl-8" placeholder="Search by phone..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-white/[0.05]">{['User ID', 'Phone', 'Balance', 'Balance Expires', 'Groups', 'Actions'].map(h => <th key={h} className="text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wider px-4 py-3">{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(driver => (
                <tr key={driver.user_id} className="table-row">
                  <td className="px-4 py-3 text-xs text-gray-600 font-mono">#{driver.user_id}</td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-300">{driver.phone}</td>
                  <td className="px-4 py-3 text-xs text-emerald-400 font-medium">{Number(driver.balance || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{driver.balance_expires_at || '-'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{driver.groups_count}</td>
                  <td className="px-4 py-3"><div className="flex items-center gap-1">
                    <button onClick={() => setTopupDriver(driver)} className="text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-1 rounded-lg transition-colors">Top Up</button>
                    <button onClick={() => handleDelete(driver.user_id)} className="btn-danger"><Trash2 size={11} /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && <AddDriverModal onClose={() => setShowAdd(false)} onCreated={loadUserbots} />}
      {topupDriver && <TopupModal userbot={topupDriver} onClose={() => setTopupDriver(null)} onUpdated={loadUserbots} />}
    </div>
  )
}
