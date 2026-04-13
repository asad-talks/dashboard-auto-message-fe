// Vercel serverless entry — initializes DB on cold start, then delegates to Express app
const { initDb } = require('../db')
const app = require('../server')

let dbReady = false

module.exports = async (req, res) => {
  if (!dbReady) {
    await initDb()
    dbReady = true
  }
  app(req, res)
}
