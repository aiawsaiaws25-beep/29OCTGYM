import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/api/**/*.test.js', 'tests/unit/**/*.test.js'],
    setupFiles: ['tests/setup.js'],
    testTimeout: 30000,
    hookTimeout: 60000,
    // Each test file gets its own fresh in-memory database (see tests/setup.js).
    pool: 'forks',
    fileParallelism: false,
  },
})
