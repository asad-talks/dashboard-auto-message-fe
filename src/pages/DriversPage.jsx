import { useEffect, useState } from 'react'
import { Plus, Trash2, ChevronUp, ChevronDown, Search, X } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

function AddDriverModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ phone: '', api_id: '', api_hash: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/drivers', form)
      toast.success('Driver added')
      onCreated(data)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add driver')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="card w-full max-w-md p-6 fade-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-white">Add New Driver</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-400 p-1"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
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
            <input className="input font-mono text-xs" placeholder="abc123def456..." value={form.api_hash}
              onChange={e => setForm(f => ({ ...f, api_hash: e.target.value }))} />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Add Driver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TopupModal({ driver, onClose, onUpdated }) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post(`/drivers/${driver.id}/topup`, { amount: parseFloat(amount), note })
      toast.success(`Added $${amount} to ${driver.phone}`)
      onUpdated(data)
      onClose()
    } catch (err) {
      toast.error('Top up failed')
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
        <p className="text-xs text-gray-500 mb-4">Driver: <span className="text-gray-300 font-mono">{driver.phone}</span></p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">Amount ($) *</label>
            <input className="input" type="number" step="0.01" min="0.01" placeholder="50.00" value={amount}
              onChange={e => setAmount(e.target.value)} required autoFocus />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">Note (optional)</label>
            <input className="input" placeholder="Monthly top up" value={note}
              onChange={e => setNote(e.target.value)} />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-emerald-500/80 hover:bg-emerald-500 text-white font-medium py-2 px-4 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Top Up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DeleteModal({ driver, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false)
  const handle = async () => {
    setLoading(true)
    try {
      await api.delete(`/drivers/${driver.id}`)
      toast.success('Driver deleted')
      onDeleted(driver.id)
      onClose()
    } catch {
      toast.error('Delete failed')
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="card w-full max-w-sm p-6 fade-in text-center">
        <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={16} className="text-red-400" />
        </div>
        <h2 className="text-sm font-semibold text-white mb-2">Delete Driver</h2>
        <p className="text-xs text-gray-500 mb-5">This will permanently delete <span className="font-mono text-gray-300">{driver.phone}</span> and all associated groups.</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-ghost flex-1 justify-center">Cancel</button>
          <button onClick={handle} disabled={loading}
            className="flex-1 bg-red-500/80 hover:bg-red-500 text-white font-medium py-2 px-4 rounded-xl text-sm transition-all duration-200 flex items-center justify-center">
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Delete'}
          </button>
        </div>
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
  const [deleteDriver, setDeleteDriver] = useState(null)

  useEffect(() => {
    api.get('/drivers').then(r => setDrivers(r.data)).finally(() => setLoading(false))
  }, [])

  const filtered = drivers.filter(d => d.phone.toLowerCase().includes(search.toLowerCase()))

  const handleToggleStatus = async (driver) => {
    try {
      const { data } = await api.patch(`/drivers/${driver.id}/status`)
      setDrivers(ds => ds.map(d => d.id === driver.id ? { ...d, userbot_status: data.userbot_status } : d))
      toast.success(`Userbot ${data.userbot_status}`)
    } catch { toast.error('Failed') }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Drivers</h1>
          <p className="text-sm text-gray-600">{drivers.length} registered drivers</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={14} /> Add Driver
        </button>
      </div>

      <div className="card">
        {/* Search */}
        <div className="p-4 border-b border-white/[0.05]">
          <div className="relative max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
            <input className="input pl-8" placeholder="Search by phone..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.05]">
                {['ID', 'Phone', 'Balance', 'Status', 'Groups', 'Actions'].map(h => (
                  <th key={h} className="text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(driver => (
                <tr key={driver.id} className="table-row">
                  <td className="px-4 py-3 text-xs text-gray-600 font-mono">#{driver.id}</td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-300">{driver.phone}</td>
                  <td className="px-4 py-3 text-xs text-emerald-400 font-medium">${parseFloat(driver.balance).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggleStatus(driver)}>
                      <span className={driver.userbot_status === 'online' ? 'badge-online' : 'badge-offline'}>
                        <span className={`w-1.5 h-1.5 rounded-full ${driver.userbot_status === 'online' ? 'bg-emerald-400 pulse-dot' : 'bg-gray-600'}`} />
                        {driver.userbot_status}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{driver.groups_count}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setTopupDriver(driver)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-1 rounded-lg transition-colors">
                        Top Up
                      </button>
                      <button onClick={() => setDeleteDriver(driver)} className="btn-danger">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center text-xs text-gray-600 py-10">No drivers found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && <AddDriverModal onClose={() => setShowAdd(false)} onCreated={d => setDrivers(ds => [d, ...ds])} />}
      {topupDriver && <TopupModal driver={topupDriver} onClose={() => setTopupDriver(null)} onUpdated={d => setDrivers(ds => ds.map(x => x.id === d.id ? { ...x, balance: d.balance } : x))} />}
      {deleteDriver && <DeleteModal driver={deleteDriver} onClose={() => setDeleteDriver(null)} onDeleted={id => setDrivers(ds => ds.filter(d => d.id !== id))} />}
    </div>
  )
}
