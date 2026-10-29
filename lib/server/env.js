// Environment checks shared by the local dev server and the db:setup script.
// Never import this from frontend code.
import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, appendFileSync, writeFileSync } from 'node:fs'

export const DATABASE_URL_HELP = `
DATABASE_URL is missing.

Copy it from the Neon dashboard:
  1. Open https://console.neon.tech and select your project.
  2. On the project Dashboard, find the "Connection Details" panel.
  3. Pick the branch (main) and database, tick "Pooled connection" if offered.
  4. Click the copy icon next to the connection string. It looks like:
     postgresql://USER:PASSWORD@ep-xxxx-pooler.REGION.aws.neon.tech/neondb?sslmode=require
  5. Paste it into the .env file in this project as:
     DATABASE_URL=postgresql://...

Then run:  npm run db:setup
`

export function assertDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    console.error(DATABASE_URL_HELP)
    process.exit(1)
  }
}

/** Ensures JWT_SECRET exists, generating one into .env if it is missing. */
export function ensureJwtSecret(envPath = '.env') {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32) return false
  const secret = randomBytes(48).toString('base64url')
  process.env.JWT_SECRET = secret
  if (!existsSync(envPath)) {
    writeFileSync(envPath, `DATABASE_URL=\nJWT_SECRET=${secret}\n`)
  } else {
    const current = readFileSync(envPath, 'utf8')
    if (/^JWT_SECRET=.*$/m.test(current)) {
      writeFileSync(envPath, current.replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${secret}`))
    } else {
      appendFileSync(envPath, `${current.endsWith('\n') || current === '' ? '' : '\n'}JWT_SECRET=${secret}\n`)
    }
  }
  console.log('Generated a new JWT_SECRET and saved it to .env')
  return true
}
