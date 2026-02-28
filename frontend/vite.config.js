import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1]
const githubPagesBase = repoName ? `/${repoName}/` : '/'

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || githubPagesBase,
  server: {
    port: 5173,
    host: '0.0.0.0'
  }
})
