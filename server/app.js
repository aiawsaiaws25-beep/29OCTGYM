// Builds the Express app that mounts every /api route file using Vercel's file-based routing rules.
// Used by the local dev server and by the backend test suite.
import express from 'express'
import { readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const apiDir = path.join(root, 'api')

export function discoverRoutes(dir = apiDir, prefix = '/api') {
  const routes = []
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('_') || entry.startsWith('.')) continue
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) {
      routes.push(...discoverRoutes(full, `${prefix}/${entry}`))
      continue
    }
    if (!/\.(js|mjs)$/.test(entry)) continue
    const base = entry.replace(/\.(js|mjs)$/, '')
    const segment = base === 'index' ? '' : `/${base.replace(/\[(\w+)\]/g, ':$1')}`
    routes.push({ route: `${prefix}${segment}` || '/', file: full })
  }
  return routes
}

export async function createApp() {
  const app = express()
  app.disable('x-powered-by')
  app.use(express.json({ limit: '1mb' }))

  const routes = discoverRoutes()
  for (const { route, file } of routes) {
    const mod = await import(pathToFileURL(file).href)
    const handler = mod.default
    if (typeof handler !== 'function') continue
    app.all(route, (req, res) => {
      // Vercel merges path params into req.query. Express 5 exposes query as a getter, so redefine it.
      const merged = { ...req.query, ...req.params }
      Object.defineProperty(req, 'query', { value: merged, writable: true, configurable: true })
      Promise.resolve(handler(req, res)).catch((err) => {
        console.error(`[api] ${route}`, err)
        if (!res.headersSent) res.status(500).json({ error: 'Internal server error' })
      })
    })
  }

  app.use('/api', (req, res) => res.status(404).json({ error: `No API route for ${req.method} ${req.path}` }))
  app.routes = routes
  return app
}
