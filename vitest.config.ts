import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['tests/setup/vitest.setup.ts'],
    include: ['tests/unit/**/*.test.ts'],
    reporters: 'default',
    pool: 'threads',
    coverage: {
      enabled: false,
    },
  },
});
