const jwt = require('jsonwebtoken')

const SECRET = process.env.SECRET_KEY || 'supersecretkey_change_in_prod'

function createToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '24h' })
}

function requireAuth(req, res, next) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ detail: 'Missing token' })
  try {
    req.user = jwt.verify(auth.slice(7), SECRET)
    next()
  } catch {
    res.status(401).json({ detail: 'Invalid or expired token' })
  }
}

module.exports = { createToken, requireAuth }
