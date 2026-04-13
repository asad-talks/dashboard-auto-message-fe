// Vercel serverless entry point (must be at root /api/)
const { initDb } = require('../backend/db')
const app = require('../backend/server')

let dbReady = false

module.exports = async (req, res) => {
  if (!dbReady) {
    await initDb()
    dbReady = true
  }
  app(req, res)
}
