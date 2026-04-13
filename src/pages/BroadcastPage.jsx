import { useEffect, useState, useRef } from 'react'
import { Send, CheckSquare, Square, Megaphone } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function BroadcastPage() {
  const [content, setContent] = useState('')
  const [drivers, setDrivers] = useState([])
  const [groups, setGroups] = useState([])
  const [selectedDrivers, setSelectedDrivers] = useState([])
  const [selectedGroups, setSelectedGroups] = useState([])
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    Promise.all([api.get('/drivers'), api.get('/groups')]).then(([d, g]) => {
      setDrivers(d.data)
      setGroups(g.data)
    })
  }, [])

  const toggleDriver = (id) => {
    setSelectedDrivers(s =>
      s.includes(id) ? s.filter(x => x !== id) : [...s, id]
    )
  }

  const toggleGroup = (id) => {
    setSelectedGroups(s =>
      s.includes(id) ? s.filter(x => x !== id) : [...s, id]
    )
  }

  const selectAllDrivers = () => {
    setSelectedDrivers(drivers.map(d => d.id))
    setSelectedGroups(groups.map(g => g.id))
  }

  const clearAll = () => {
    setSelectedDrivers([])
    setSelectedGroups([])
  }

  const driverGroups = (driverId) => groups.filter(g => g.driver_id === driverId && selectedDrivers.includes(driverId))

  const handleSend = () => {
    if (!content.trim()) return toast.error('Enter message content')
    if (!selectedDrivers.length) return toast.error('Select at least one driver')
    if (!selectedGroups.length) return toast.error('Select at least one group')

    setSending(true)
    setProgress(0)
    setCountdown(5)

    let elapsed = 0
    timerRef.current = setInterval(() => {
      elapsed += 100
      const pct = Math.min((elapsed / 5000) * 100, 100)
      setProgress(pct)
      setCountdown(Math.ceil((5000 - elapsed) / 1000))
      if (elapsed >= 5000) {
        clearInterval(timerRef.current)
        doSend()
      }
    }, 100)
  }

  const cancelSend = () => {
    clearInterval(timerRef.current)
    setSending(false)
    setProgress(0)
    setCountdown(0)
    toast('Broadcast cancelled')
  }

  const doSend = async () => {
    try {
      const { data } = await api.post('/broadcast/send', {
        content,
        driver_ids: selectedDrivers,
        group_ids: selectedGroups,
      })
      toast.success(`Sent to ${data.sent_count} groups!`)
      setContent('')
      setSelectedDrivers([])
      setSelectedGroups([])
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Send failed')
    } finally {
      setSending(false)
      setProgress(0)
      setCountdown(0)
    }
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h1 className="text-lg font-semibold text-white">Broadcast</h1>
        <p className="text-sm text-gray-600">Send a message to selected drivers and groups</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Message composer */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-3">Message Content</label>
            <textarea
              className="input resize-none"
              rows={8}
              placeholder="Type your broadcast message here..."
              value={content}
              onChange={e => setContent(e.target.value)}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-700">{content.length} chars</span>
              <span className="text-xs text-gray-700">{selectedGroups.length} groups selected</span>
            </div>
          </div>

          {/* Send button / progress */}
          {sending ? (
            <div className="card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">Sending in {countdown}s...</span>
                <button onClick={cancelSend} className="text-xs text-red-400 hover:text-red-300">Cancel</button>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-600">Sending to {selectedDrivers.length} driver(s), {selectedGroups.length} group(s)</p>
            </div>
          ) : (
            <button
              onClick={handleSend}
              disabled={!content.trim() || !selectedDrivers.length || !selectedGroups.length}
              className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Send size={14} /> Send Broadcast
            </button>
          )}
        </div>

        {/* Driver/Group selector */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white">Select Recipients</span>
            <div className="flex gap-2">
              <button onClick={selectAllDrivers} className="text-[10px] text-indigo-400 hover:text-indigo-300">All</button>
              <span className="text-gray-700">·</span>
              <button onClick={clearAll} className="text-[10px] text-gray-600 hover:text-gray-400">Clear</button>
            </div>
          </div>

          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {drivers.map(driver => (
              <div key={driver.id}>
                {/* Driver checkbox */}
                <button
                  onClick={() => {
                    toggleDriver(driver.id)
                    const dGroups = groups.filter(g => g.driver_id === driver.id).map(g => g.id)
                    if (selectedDrivers.includes(driver.id)) {
                      setSelectedGroups(s => s.filter(id => !dGroups.includes(id)))
                    } else {
                      setSelectedGroups(s => [...new Set([...s, ...dGroups])])
                    }
                  }}
                  className="flex items-center gap-2.5 w-full text-left hover:bg-white/[0.03] rounded-lg px-2 py-1.5 transition-colors"
                >
                  {selectedDrivers.includes(driver.id)
                    ? <CheckSquare size={14} className="text-indigo-400 flex-shrink-0" />
                    : <Square size={14} className="text-gray-700 flex-shrink-0" />}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${driver.userbot_status === 'online' ? 'bg-emerald-400' : 'bg-gray-700'}`} />
                    <span className="text-xs font-mono text-gray-300 truncate">{driver.phone}</span>
                  </div>
                </button>

                {/* Group checkboxes */}
                {selectedDrivers.includes(driver.id) && (
                  <div className="ml-6 mt-1 space-y-1">
                    {groups.filter(g => g.driver_id === driver.id).map(group => (
                      <button key={group.id} onClick={() => toggleGroup(group.id)}
                        className="flex items-center gap-2 w-full text-left hover:bg-white/[0.03] rounded-lg px-2 py-1 transition-colors">
                        {selectedGroups.includes(group.id)
                          ? <CheckSquare size={12} className="text-indigo-400/70 flex-shrink-0" />
                          : <Square size={12} className="text-gray-800 flex-shrink-0" />}
                        <span className="text-[11px] font-mono text-gray-500 truncate">{group.username}</span>
                      </button>
                    ))}
                    {groups.filter(g => g.driver_id === driver.id).length === 0 && (
                      <p className="text-[11px] text-gray-700 px-2 py-1">No groups</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
