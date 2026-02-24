import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/index.ts', 'src/db/seed.ts'],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
  },
  // Don't search parent directories for config files
  configFile: false,
})
