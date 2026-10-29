import { allow, route } from '../../lib/server/http.js'
import { clearSessionCookie } from '../../lib/server/auth.js'

export default route(async (req, res) => {
  if (!allow(req, res, 'POST')) return
  clearSessionCookie(res)
  res.status(200).json({ ok: true })
})
