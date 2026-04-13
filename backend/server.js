const express = require('express')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const { query, initDb } = require('./db')
const { createToken, requireAuth } = require('./auth')
const dotenv = require('dotenv')
dotenv.config()
const app = express()

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}))
app.use(express.json())

// ─── Health ───────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

// ─── Auth ─────────────────────────────────────────────────
app.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body
    const result = await query('SELECT * FROM users WHERE username = $1', [username])
    const user = result.rows[0]
    if (!user) return res.status(401).json({ detail: 'Invalid credentials' })
    const ok = await bcrypt.compare(password, user.password_hash)
    if (!ok) return res.status(401).json({ detail: 'Invalid credentials' })
    const token = createToken({ sub: user.username, id: user.id })
    res.json({ access_token: token, token_type: 'bearer', username: user.username })
  } catch (e) {
    res.status(500).json({ detail: e.message })
  }
})

// ─── Drivers ──────────────────────────────────────────────
app.get('/drivers', requireAuth, async (req, res) => {
  try {
    const result = await query(`
      SELECT d.*, COUNT(DISTINCT g.id)::int as groups_count
      FROM drivers d
      LEFT JOIN groups g ON g.driver_id = d.id
      GROUP BY d.id ORDER BY d.created_at DESC
    `)
    res.json(result.rows)
  } catch (e) { res.status(500).json({ detail: e.message }) }
})

app.get('/drivers/stats/overview', requireAuth, async (req, res) => {
  try {
    const [total, active, balance, msgs, activity] = await Promise.all([
      query('SELECT COUNT(*)::int as c FROM drivers'),
      query("SELECT COUNT(*)::int as c FROM drivers WHERE userbot_status = 'online'"),
      query('SELECT COALESCE(SUM(balance),0) as s FROM drivers'),
      query("SELECT COUNT(*)::int as c FROM messages_log WHERE sent_at::date = CURRENT_DATE"),
      query(`SELECT a.*, d.phone as driver_phone FROM activity_log a
             LEFT JOIN drivers d ON d.id = a.driver_id
             ORDER BY a.created_at DESC LIMIT 10`),
    ])
    res.json({
      total_drivers: total.rows[0].c,
      active_userbots: active.rows[0].c,
      total_balance: parseFloat(balance.rows[0].s),
      messages_today: msgs.rows[0].c,
      recent_activity: activity.rows,
    })
  } catch (e) { res.status(500).json({ detail: e.message }) }
})

app.post('/drivers', requireAuth, async (req, res) => {
  try {
    const { phone, api_id, api_hash } = req.body
    const exists = await query('SELECT id FROM drivers WHERE phone = $1', [phone])
    if (exists.rows.length) return res.status(400).json({ detail: 'Phone already exists' })
    const result = await query(
      'INSERT INTO drivers (phone, api_id, api_hash) VALUES ($1,$2,$3) RETURNING *',
      [phone, api_id, api_hash]
    )
    await query('INSERT INTO activity_log (driver_id, action, details) VALUES ($1,$2,$3)',
      [result.rows[0].id, 'driver_created', `New driver ${phone}`])
    res.json(result.rows[0])
  } catch (e) { res.status(500).json({ detail: e.message }) }
})

app.post('/drivers/:id/topup', requireAuth, async (req, res) => {
  try {
    const { amount, note } = req.body
    const result = await query(
      'UPDATE drivers SET balance = balance + $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [amount, req.params.id]
    )
    if (!result.rows.length) return res.status(404).json({ detail: 'Driver not found' })
    await query('INSERT INTO balance_history (driver_id, amount, type, note) VALUES ($1,$2,$3,$4)',
      [req.params.id, amount, 'topup', note])
    await query('INSERT INTO activity_log (driver_id, action, details) VALUES ($1,$2,$3)',
      [req.params.id, 'balance_topup', `Added ${amount}`])
    res.json(result.rows[0])
  } catch (e) { res.status(500).json({ detail: e.message }) }
})

app.patch('/drivers/:id/status', requireAuth, async (req, res) => {
  try {
    const cur = await query('SELECT userbot_status FROM drivers WHERE id = $1', [req.params.id])
    if (!cur.rows.length) return res.status(404).json({ detail: 'Not found' })
    const next = cur.rows[0].userbot_status === 'online' ? 'offline' : 'online'
    const result = await query(
      'UPDATE drivers SET userbot_status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [next, req.params.id]
    )
    res.json(result.rows[0])
  } catch (e) { res.status(500).json({ detail: e.message }) }
})

app.delete('/drivers/:id', requireAuth, async (req, res) => {
  try {
    const result = await query('DELETE FROM drivers WHERE id = $1 RETURNING id', [req.params.id])
    if (!result.rows.length) return res.status(404).json({ detail: 'Not found' })
    res.json({ success: true })
  } catch (e) { res.status(500).json({ detail: e.message }) }
})

// ─── Groups ───────────────────────────────────────────────
app.get('/groups', requireAuth, async (req, res) => {
  try {
    const { driver_id } = req.query
    const result = driver_id
      ? await query('SELECT g.*, d.phone as driver_phone FROM groups g JOIN drivers d ON d.id = g.driver_id WHERE g.driver_id = $1 ORDER BY g.created_at DESC', [driver_id])
      : await query('SELECT g.*, d.phone as driver_phone FROM groups g JOIN drivers d ON d.id = g.driver_id ORDER BY g.driver_id, g.created_at DESC')
    res.json(result.rows)
  } catch (e) { res.status(500).json({ detail: e.message }) }
})

app.post('/groups', requireAuth, async (req, res) => {
  try {
    let { driver_id, username, title } = req.body
    if (!username.startsWith('@')) username = '@' + username
    const result = await query(
      'INSERT INTO groups (driver_id, username, title) VALUES ($1,$2,$3) RETURNING *',
      [driver_id, username, title || username]
    )
    await query('INSERT INTO activity_log (driver_id, action, details) VALUES ($1,$2,$3)',
      [driver_id, 'group_added', username])
    res.json(result.rows[0])
  } catch (e) { res.status(500).json({ detail: e.message }) }
})

app.delete('/groups/:id', requireAuth, async (req, res) => {
  try {
    const result = await query('DELETE FROM groups WHERE id = $1 RETURNING id', [req.params.id])
    if (!result.rows.length) return res.status(404).json({ detail: 'Not found' })
    res.json({ success: true })
  } catch (e) { res.status(500).json({ detail: e.message }) }
})

// ─── Broadcast ────────────────────────────────────────────
app.post('/broadcast/send', requireAuth, async (req, res) => {
  try {
    const { content, driver_ids, group_ids } = req.body
    if (!content?.trim()) return res.status(400).json({ detail: 'Content required' })
    if (!driver_ids?.length) return res.status(400).json({ detail: 'Select at least one driver' })
    if (!group_ids?.length) return res.status(400).json({ detail: 'Select at least one group' })

    const bc = await query(
      "INSERT INTO broadcasts (content, driver_ids, group_ids, status) VALUES ($1,$2,$3,'sending') RETURNING *",
      [content, driver_ids, group_ids]
    )

    let sent = 0
    for (const gid of group_ids) {
      const g = await query('SELECT * FROM groups WHERE id = $1', [gid])
      if (g.rows.length && driver_ids.includes(g.rows[0].driver_id)) {
        await query('INSERT INTO messages_log (driver_id, group_id, content) VALUES ($1,$2,$3)',
          [g.rows[0].driver_id, gid, content])
        sent++
      }
    }

    await query('UPDATE broadcasts SET status = $1, sent_count = $2 WHERE id = $3',
      ['sent', sent, bc.rows[0].id])
    for (const did of driver_ids) {
      await query('INSERT INTO activity_log (driver_id, action, details) VALUES ($1,$2,$3)',
        [did, 'broadcast_sent', `Sent to ${sent} groups`])
    }
    res.json({ success: true, broadcast_id: bc.rows[0].id, sent_count: sent })
  } catch (e) { res.status(500).json({ detail: e.message }) }
})

app.get('/broadcast/history', requireAuth, async (req, res) => {
  try {
    const result = await query('SELECT * FROM broadcasts ORDER BY created_at DESC LIMIT 50')
    res.json(result.rows)
  } catch (e) { res.status(500).json({ detail: e.message }) }
})

// ─── Analytics ────────────────────────────────────────────
app.get('/analytics/messages-per-day', requireAuth, async (req, res) => {
  try {
    const result = await query(`
      SELECT DATE(sent_at) as date, COUNT(*)::int as count
      FROM messages_log WHERE sent_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(sent_at) ORDER BY date ASC
    `)
    res.json(result.rows.map(r => ({ date: r.date.toISOString().slice(0, 10), count: r.count })))
  } catch (e) { res.status(500).json({ detail: e.message }) }
})

app.get('/analytics/top-drivers', requireAuth, async (req, res) => {
  try {
    const result = await query(`
      SELECT d.phone, d.id, COUNT(m.id)::int as messages_sent
      FROM drivers d
      LEFT JOIN messages_log m ON m.driver_id = d.id AND m.sent_at >= NOW() - INTERVAL '30 days'
      GROUP BY d.id, d.phone ORDER BY messages_sent DESC LIMIT 10
    `)
    res.json(result.rows)
  } catch (e) { res.status(500).json({ detail: e.message }) }
})

app.get('/analytics/balance-history', requireAuth, async (req, res) => {
  try {
    const result = await query(`
      SELECT DATE(created_at) as date, SUM(amount)::float as total_topup
      FROM balance_history WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at) ORDER BY date ASC
    `)
    res.json(result.rows.map(r => ({ date: r.date.toISOString().slice(0, 10), total_topup: r.total_topup })))
  } catch (e) { res.status(500).json({ detail: e.message }) }
})

// ─── Start ────────────────────────────────────────────────
const PORT = process.env.PORT || 8000

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))
  })
  .catch(err => {
    console.error('Failed to init DB:', err)
    process.exit(1)
  })

module.exports = app
