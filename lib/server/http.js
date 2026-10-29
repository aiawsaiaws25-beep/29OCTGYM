// Small helpers so each /api handler works identically on Vercel and the local Express server.

export function allow(req, res, ...methods) {
  if (methods.includes(req.method)) return true
  res.setHeader('Allow', methods.join(', '))
  res.status(405).json({ error: `Method ${req.method} not allowed` })
  return false
}

export function body(req) {
  const b = req.body
  if (!b) return {}
  if (typeof b === 'string') {
    try {
      return JSON.parse(b)
    } catch {
      return {}
    }
  }
  return b
}

export function fail(res, status, message) {
  res.status(status).json({ error: message })
}

/** Wraps a handler so thrown errors become JSON responses instead of crashes. */
export function route(fn) {
  return async (req, res) => {
    try {
      await fn(req, res)
    } catch (err) {
      const status = err.status || 500
      if (status >= 500) console.error(`[api] ${req.method} ${req.url}`, err)
      res.status(status).json({ error: status >= 500 ? 'Something went wrong on our side. Please try again.' : err.message })
    }
  }
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** Returns a YYYY-MM-DD string from the query, or today's date (UTC) when absent/invalid. */
export function dateParam(req, key) {
  const v = req.query?.[key]
  if (typeof v === 'string' && DATE_RE.test(v)) return v
  return new Date().toISOString().slice(0, 10)
}
