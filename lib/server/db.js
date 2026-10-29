// Server-only database client. Never import this from frontend code.
//
// Two backends, same SQL:
//   - DATABASE_URL set   -> Neon Postgres (production / Vercel)
//   - DATABASE_URL empty -> PGlite, an embedded Postgres stored in ./.pglite (local dev only)
//     PGLITE_DIR=memory:// gives a throwaway in-memory database (used by the test suite).
import path from 'node:path'

let backendPromise

export function isLocalMode() {
  return !process.env.DATABASE_URL
}

function toQuery(strings, values) {
  let text = strings[0]
  for (let i = 0; i < values.length; i++) text += `$${i + 1}${strings[i + 1]}`
  return { text, params: values }
}

async function neonBackend() {
  const { neon } = await import('@neondatabase/serverless')
  const client = neon(process.env.DATABASE_URL)
  return {
    name: 'neon',
    sql: (strings, values) => client(strings, ...values),
    query: (text, params) => client.query(text, params),
    exec: async (text) => {
      const ws = (await import('ws')).default
      const { Pool, neonConfig } = await import('@neondatabase/serverless')
      neonConfig.webSocketConstructor = ws
      const pool = new Pool({ connectionString: process.env.DATABASE_URL })
      try {
        await pool.query(text)
      } finally {
        await pool.end()
      }
    },
    close: async () => {},
  }
}

async function pgliteBackend() {
  // Variable specifier so Vercel's bundler never traces PGlite into the serverless functions.
  const spec = '@electric-sql/pglite'
  const { PGlite } = await import(spec)
  const dir = process.env.PGLITE_DIR || '.pglite'
  const db = dir === 'memory://' ? new PGlite() : new PGlite(path.resolve(dir))
  await db.waitReady
  return {
    name: 'pglite',
    sql: async (strings, values) => {
      const { text, params } = toQuery(strings, values)
      return (await db.query(text, params)).rows
    },
    query: async (text, params) => (await db.query(text, params)).rows,
    exec: (text) => db.exec(text),
    close: () => db.close(),
  }
}

async function getBackend() {
  if (!backendPromise) backendPromise = isLocalMode() ? pgliteBackend() : neonBackend()
  return backendPromise
}

/** Tagged template: await sql`SELECT * FROM users WHERE id = ${id}` -> rows */
export async function sql(strings, ...values) {
  const b = await getBackend()
  return b.sql(strings, values)
}

/** Parameterised query from a plain string -> rows */
export async function query(text, params = []) {
  const b = await getBackend()
  return b.query(text, params)
}

/** Runs a multi-statement script (schema / seed). */
export async function exec(text) {
  const b = await getBackend()
  return b.exec(text)
}

export async function backendName() {
  return (await getBackend()).name
}

/** Closes the connection (tests). */
export async function closeDb() {
  if (!backendPromise) return
  const b = await backendPromise
  backendPromise = undefined
  await b.close()
}
