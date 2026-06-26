import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [
    tailwindcss(),
    react(),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['src/**/*.{ts,tsx}', 'front-aluno/src/**/*.{ts,tsx}', 'front-coordenador-professor/src/**/*.{ts,tsx}'],
      exclude: ['**/*.d.ts', '**/*.types.ts', '**/main.tsx', '**/imports/**'],
      thresholds: {
        statements: 90,
        branches: 75,
        functions: 70,
        lines: 90,
      },
    },
  },
})
