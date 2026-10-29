// Local API host. Started by `npm run dev` alongside Vite, which proxies /api here.
import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ensureJwtSecret } from '../lib/server/env.js'
import { isLocalMode } from '../lib/server/db.js'
import { ensureLocalSchema } from '../db/run-setup.js'
import { createApp } from './app.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PORT = Number(process.env.API_PORT) || 3001

ensureJwtSecret(path.join(root, '.env'))

if (isLocalMode()) {
  console.log(`[db] DATABASE_URL is empty: using the local embedded Postgres in ./${process.env.PGLITE_DIR || '.pglite'}`)
  console.log('[db] Paste your Neon connection string into .env to switch to Neon.')
  await ensureLocalSchema()
} else {
  console.log('[db] Using Neon Postgres from DATABASE_URL')
}

const app = await createApp()
app.listen(PORT, () => {
  console.log(`API ready on http://localhost:${PORT}`)
  for (const { route } of app.routes) console.log(`  ${route}`)
})
