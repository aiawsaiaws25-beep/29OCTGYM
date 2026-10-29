import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { exec, sql, backendName } from '../lib/server/db.js'

const here = path.dirname(fileURLToPath(import.meta.url))

export async function runSetup({ log = false } = {}) {
  const name = await backendName()
  if (log) console.log(`Database backend: ${name === 'neon' ? 'Neon Postgres' : 'local embedded Postgres (.pglite)'}`)
  for (const file of ['schema.sql', 'seed.sql']) {
    const text = await readFile(path.join(here, file), 'utf8')
    if (log) process.stdout.write(`Running ${file}... `)
    await exec(text)
    if (log) console.log('ok')
  }
  const [row] = await sql`
    SELECT (SELECT count(*) FROM exercises)::int AS exercises,
           (SELECT count(*) FROM classes)::int AS classes,
           (SELECT count(*) FROM users)::int AS users
  `
  if (log) console.log(`Database ready: ${row.exercises} exercises, ${row.classes} classes, ${row.users} users.`)
  return row
}

/** Local mode only: creates tables + seed automatically if the schema is missing. */
export async function ensureLocalSchema() {
  const rows = await sql`SELECT to_regclass('public.users') AS t`
  if (!rows[0]?.t) {
    console.log('[db] Fresh local database, creating tables and sample data...')
    await runSetup({ log: false })
  }
}
