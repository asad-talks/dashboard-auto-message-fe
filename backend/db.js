const { Pool } = require('pg')
const dotenv = require('dotenv')
dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway') || process.env.DATABASE_URL?.includes('neon')
    ? { rejectUnauthorized: false }
    : false,
})

async function query(text, params) {
  const client = await pool.connect()
  try {
    const res = await client.query(text, params)
    return res
  } finally {
    client.release()
  }
}

async function initDb() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS drivers (
      id SERIAL PRIMARY KEY,
      phone VARCHAR(20) UNIQUE NOT NULL,
      api_id VARCHAR(50),
      api_hash VARCHAR(100),
      balance DECIMAL(10,2) DEFAULT 0.00,
      userbot_status VARCHAR(20) DEFAULT 'offline',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS groups (
      id SERIAL PRIMARY KEY,
      driver_id INTEGER REFERENCES drivers(id) ON DELETE CASCADE,
      username VARCHAR(100) NOT NULL,
      title VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS broadcasts (
      id SERIAL PRIMARY KEY,
      content TEXT NOT NULL,
      driver_ids INTEGER[],
      group_ids INTEGER[],
      status VARCHAR(20) DEFAULT 'pending',
      sent_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id SERIAL PRIMARY KEY,
      driver_id INTEGER REFERENCES drivers(id) ON DELETE SET NULL,
      action VARCHAR(100) NOT NULL,
      details TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS balance_history (
      id SERIAL PRIMARY KEY,
      driver_id INTEGER REFERENCES drivers(id) ON DELETE CASCADE,
      amount DECIMAL(10,2) NOT NULL,
      type VARCHAR(20) NOT NULL,
      note TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS messages_log (
      id SERIAL PRIMARY KEY,
      driver_id INTEGER REFERENCES drivers(id) ON DELETE SET NULL,
      group_id INTEGER REFERENCES groups(id) ON DELETE SET NULL,
      content TEXT,
      sent_at TIMESTAMP DEFAULT NOW()
    );
  `)

  // Default admin
  const bcrypt = require('bcryptjs')
  const existing = await query('SELECT id FROM users WHERE username = $1', ['admin'])
  if (existing.rows.length === 0) {
    const hash = await bcrypt.hash('admin123', 10)
    await query('INSERT INTO users (username, password_hash) VALUES ($1, $2)', ['admin', hash])
  }

  // Seed sample data
  const count = await query('SELECT COUNT(*) FROM drivers')
  if (parseInt(count.rows[0].count) === 0) {
    await query(`
      INSERT INTO drivers (phone, api_id, api_hash, balance, userbot_status) VALUES
      ('+1234567890', '12345678', 'abc123def456ghi789', 250.00, 'online'),
      ('+0987654321', '87654321', 'xyz987uvw654rst321', 180.50, 'online'),
      ('+1122334455', '11223344', 'qwerty123456789abc', 90.00, 'offline'),
      ('+5544332211', '55443322', 'poiuyt987654321zxc', 320.75, 'online'),
      ('+9988776655', '99887766', 'lkjhgf123456789mnb', 0.00, 'offline')
    `)
    const drivers = await query('SELECT id FROM drivers ORDER BY id')
    const [d1, d2, d3, d4, d5] = drivers.rows.map(r => r.id)
    await query(`
      INSERT INTO groups (driver_id, username, title) VALUES
      ($1, '@taxi_moscow_north', 'Taxi Moscow North'),
      ($1, '@taxi_moscow_south', 'Taxi Moscow South'),
      ($2, '@taxi_spb_central', 'SPB Central'),
      ($3, '@taxi_kazan', 'Kazan Drivers'),
      ($4, '@taxi_nsk', 'Novosibirsk'),
      ($4, '@taxi_nsk_vip', 'NSK VIP'),
      ($5, '@taxi_ekb', 'Ekaterinburg')
    `, [d1, d2, d3, d4, d5])

    for (const driverId of [d1, d2, d3, d4, d5]) {
      for (let i = 0; i < 30; i++) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const cnt = Math.floor(Math.random() * 15)
        if (cnt > 0) {
          await query('INSERT INTO messages_log (driver_id, sent_at) VALUES ($1, $2)', [driverId, d])
        }
      }
      for (let j = 0; j < 5; j++) {
        const amt = (Math.random() * 190 + 10).toFixed(2)
        const d = new Date()
        d.setDate(d.getDate() - Math.floor(Math.random() * 29))
        await query('INSERT INTO balance_history (driver_id, amount, type, created_at) VALUES ($1, $2, $3, $4)',
          [driverId, amt, 'topup', d])
      }
    }
    await query(`
      INSERT INTO activity_log (driver_id, action, details) VALUES
      ($1, 'broadcast_sent', 'Sent to 2 groups'),
      ($2, 'balance_topup', 'Added 50.00'),
      ($3, 'userbot_offline', 'Connection lost'),
      ($4, 'group_added', '@taxi_nsk_vip'),
      ($1, 'broadcast_sent', 'Morning message sent')
    `, [d1, d2, d3, d4])
  }

  console.log('✅ DB initialized')
}

module.exports = { query, initDb }
