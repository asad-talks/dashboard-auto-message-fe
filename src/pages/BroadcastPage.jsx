import { useEffect, useState } from 'react'
import { Save, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function BroadcastPage() {
  const [userbots, setUserbots] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [postText, setPostText] = useState('')
  const [allPosts, setAllPosts] = useState([])

  const loadData = async () => {
    const [u, p] = await Promise.all([api.get('/userbots'), api.get('/posts/all')])
    setUserbots(u.data)
    setAllPosts(p.data)
  }

  useEffect(() => {
    loadData()
  }, [])

  const loadCurrent = async (userId) => {
    if (!userId) return setPostText('')
    const { data } = await api.get('/posts', { params: { user_id: userId } })
    setPostText(data?.post_text || '')
  }

  const savePost = async () => {
    if (!selectedUserId) return toast.error('Select a userbot')
    if (!postText.trim()) return toast.error('Post text is required')
    await api.post('/posts', { user_id: Number(selectedUserId), post_text: postText })
    toast.success('Auto post saved')
    loadData()
  }

  const togglePost = async (userId) => {
    await api.patch(`/posts/${userId}/toggle`)
    toast.success('Auto post toggled')
    loadData()
  }

  const clearPost = async (userId) => {
    await api.delete(`/posts/${userId}`)
    toast.success('Auto post deleted')
    if (String(userId) === selectedUserId) setPostText('')
    loadData()
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h1 className="text-lg font-semibold text-white">Auto Posts</h1>
        <p className="text-sm text-gray-600">Create and manage saved auto-post messages</p>
      </div>

      <div className="card p-5 space-y-4">
        <div>
          <label className="text-xs text-gray-500 block mb-1.5">Userbot</label>
          <select className="input max-w-sm" value={selectedUserId} onChange={async (e) => {
            setSelectedUserId(e.target.value)
            await loadCurrent(e.target.value)
          }}>
            <option value="">Select userbot...</option>
            {userbots.map(u => <option key={u.user_id} value={u.user_id}>{u.phone}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-500 block mb-1.5">Post Text</label>
          <textarea className="input resize-none" rows={7} value={postText} onChange={e => setPostText(e.target.value)} placeholder="Write auto-post text..." />
        </div>

        <button onClick={savePost} className="btn-primary"><Save size={14} /> Save Auto Post</button>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-semibold text-white mb-4">All Saved Posts</h2>
        <div className="space-y-3">
          {allPosts.map((p) => (
            <div key={p.id} className="border border-white/[0.06] rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-mono text-gray-300">{p.userbot_phone || p.user_id}</div>
                <div className="flex gap-2">
                  <button onClick={() => togglePost(p.user_id)} className="btn-ghost text-xs">
                    {p.is_active === 1 ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    {p.is_active === 1 ? 'Active' : 'Inactive'}
                  </button>
                  <button onClick={() => clearPost(p.user_id)} className="btn-danger"><Trash2 size={11} /></button>
                </div>
              </div>
              <p className="text-xs text-gray-400 whitespace-pre-wrap">{p.post_text}</p>
            </div>
          ))}
          {allPosts.length === 0 && <p className="text-xs text-gray-600">No saved posts yet.</p>}
        </div>
      </div>
    </div>
  )
}
