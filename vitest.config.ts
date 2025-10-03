import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
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
