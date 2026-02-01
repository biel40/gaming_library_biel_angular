import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.vitest.ts'],
    setupFiles: ['src/test/vitest.setup.ts'],
    restoreMocks: true,
    clearMocks: true,
    mockReset: true,
  },
});
