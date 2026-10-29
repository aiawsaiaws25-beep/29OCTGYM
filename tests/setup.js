// Runs before every test file. Points the API at a throwaway in-memory database
// so the real local database (.pglite) and any Neon database are never touched.
process.env.DATABASE_URL = ''
process.env.PGLITE_DIR = 'memory://'
process.env.JWT_SECRET = 'pulsefit-test-secret-do-not-use-in-production-0123456789'
process.env.NODE_ENV = 'test'
