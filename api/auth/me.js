import { allow, route } from '../../lib/server/http.js'
import { currentUser } from '../../lib/server/auth.js'

export default route(async (req, res) => {
  if (!allow(req, res, 'GET')) return
  const user = await currentUser(req)
  res.status(200).json({ user })
})
