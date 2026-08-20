import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./src/test/setup-env.js'],
    include: ['tests/**/*.test.js'],
    // Ejecución secuencial por archivo: determinismo con BD compartida
    fileParallelism: false,
  },
});
