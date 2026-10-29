// Runs db/schema.sql then db/seed.sql. Safe to run repeatedly.
// Uses Neon when DATABASE_URL is set, otherwise the local embedded database in ./.pglite.
import 'dotenv/config'
import { runSetup } from './run-setup.js'

runSetup({ log: true }).catch((err) => {
  console.error('\nDatabase setup failed:', err.message)
  process.exit(1)
})
