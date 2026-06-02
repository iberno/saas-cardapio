import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.spec.ts', 'src/**/*.spec.ts'],
    exclude: ['node_modules', 'dist', 'dist-test'],
    coverage: { provider: 'v8', include: ['src/**/*.ts'] },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
});
